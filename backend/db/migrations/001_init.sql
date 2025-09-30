-- 必要拡張（排他制約で使用）
create extension if not exists btree_gist;

-- users
create table if not exists users (
  id              integer generated always as identity primary key,
  username        varchar(32)  not null unique,
  password_hash   varchar(255) not null,
  role            varchar(20)  not null,
  is_active       boolean      not null default true,
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now(),
  constraint users_role_chk check (role in ('admin','employee'))
);

-- employees
create table if not exists employees (
  id                      integer generated always as identity primary key,
  user_id                 int unique references users(id) on delete set null,
  employee_code           varchar(32)  not null unique,
  name                    varchar(120) not null,
  employment_type         varchar(30)  not null default 'part_time',
  status                  varchar(30)  not null default 'active',
  hire_date               date         not null,
  proficiency_level       smallint     not null default 1,
  hourly_wage             numeric(10,2),
  created_at              timestamptz  not null default now(),
  updated_at              timestamptz  not null default now(),
  is_international_student boolean     not null default false,
  weekly_hour_cap         smallint,
  constraint employees_emp_type_chk check (employment_type in ('full_time','part_time','baito')),
  constraint employees_status_chk   check (status in ('active','inactive','suspended')),
  constraint employees_prof_chk     check (proficiency_level between 1 and 3),
  constraint employees_weekcap_chk  check (weekly_hour_cap is null or weekly_hour_cap between 1 and 84)
);
create index if not exists employees_status_idx     on employees(status);
create index if not exists employees_hire_date_idx  on employees(hire_date);

-- roles
create table if not exists roles (
  id    integer generated always as identity primary key,
  code  varchar(30) not null unique,
  name  varchar(60) not null
);

-- employee_roles（複合PK）
create table if not exists employee_roles (
  employee_id int not null references employees(id) on delete cascade,
  role_id     int not null references roles(id)     on delete cascade,
  level       smallint not null default 1,
  active      boolean  not null default true,
  note        varchar(255),
  primary key (employee_id, role_id),
  constraint employee_roles_level_chk check (level between 1 and 3)
);
create index if not exists employee_roles_active_idx on employee_roles(active);
create index if not exists employee_roles_role_idx   on employee_roles(role_id);

-- shifts
create table if not exists shifts (
  id         integer generated always as identity primary key,
  start_time timestamptz not null,
  end_time   timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shifts_time_chk check (end_time > start_time)
);
create index if not exists shifts_start_idx on shifts(start_time);

-- shift_requirements（複合PK）
create table if not exists shift_requirements (
  shift_id  int not null references shifts(id) on delete cascade,
  role_id   int not null references roles(id)  on delete restrict,
  capacity  int not null default 1,
  primary key (shift_id, role_id),
  constraint shift_req_capacity_chk check (capacity >= 1)
);

-- availability_requests（重複不可の排他制約）
create table if not exists availability_requests (
  id          integer generated always as identity primary key,
  employee_id int not null references employees(id) on delete cascade,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  note        varchar(255),
  constraint availability_req_time_chk check (end_time > start_time),
  constraint availability_req_no_overlap exclude using gist (
    employee_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  )
);
create index if not exists availability_requests_emp_idx    on availability_requests(employee_id);
create index if not exists availability_requests_start_idx  on availability_requests(start_time);
create index if not exists availability_requests_range_idx  on availability_requests(employee_id, start_time, end_time);

-- employee_proficiency_history
create table if not exists employee_proficiency_history (
  id          integer generated always as identity primary key,
  employee_id int not null references employees(id) on delete cascade,
  role_id     int not null references roles(id),
  evaluated_at date not null,
  level       smallint not null,
  note        varchar(255),
  constraint eph_level_chk check (level between 1 and 3)
);
create index if not exists eph_emp_role_date_idx on employee_proficiency_history(employee_id, role_id, evaluated_at desc);

-- shift_assignments（整合性を複合FKで担保）
create table if not exists shift_assignments (
  id          integer generated always as identity primary key,
  shift_id    int not null,
  employee_id int not null,
  role_id     int not null,
  status      varchar(30) not null default 'assigned',
  unique (shift_id, employee_id),
  constraint shift_assign_status_chk check (status in ('assigned','canceled')),
  constraint fk_sa_shift foreign key (shift_id) references shifts(id) on delete cascade,
  constraint fk_sa_emp   foreign key (employee_id) references employees(id) on delete cascade,
  constraint fk_sa_role  foreign key (role_id) references roles(id),
  constraint fk_sa_emp_role foreign key (employee_id, role_id)
    references employee_roles(employee_id, role_id),
  constraint fk_sa_shift_role foreign key (shift_id, role_id)
    references shift_requirements(shift_id, role_id)
);
create index if not exists shift_assign_shift_idx       on shift_assignments(shift_id);
create index if not exists shift_assign_emp_idx         on shift_assignments(employee_id);
create index if not exists shift_assign_shift_role_idx  on shift_assignments(shift_id, role_id);
create index if not exists idx_sa_emp_shift             on shift_assignments(employee_id, shift_id);

-- employee_targets（月次目標）
create table if not exists employee_targets (
  employee_id   int  not null references employees(id) on delete cascade,
  month         date not null, -- その月の1日
  target_amount numeric(12,2) not null check (target_amount >= 0),
  note          varchar(255),
  primary key (employee_id, month)
);
create index if not exists employee_targets_month_idx on employee_targets(month);

-- ビュー（割当+シフトに完了フラグ/時間）
create or replace view v_assignments_planned as
select
  sa.id,
  sa.employee_id,
  sa.role_id,
  sa.status,
  s.id as shift_id,
  s.start_time,
  s.end_time,
  (s.end_time <= now()) as is_completed,
  extract(epoch from (s.end_time - s.start_time))/3600.0 as hours
from shift_assignments sa
join shifts s on s.id = sa.shift_id
where sa.status = 'assigned';

-- 7日ローリング上限チェック（Asia/Tokyo基準）
create or replace function trg_check_rolling_7d_cap() returns trigger as $$
declare
  cap        smallint;
  new_hours  numeric;
  win_start  timestamp;
  win_end    timestamp;
  used_hours numeric;
begin
  select weekly_hour_cap into cap
  from employees
  where id = new.employee_id;

  if cap is null then
    return new;
  end if;

  select extract(epoch from (s.end_time - s.start_time))/3600.0
  into new_hours
  from shifts s
  where s.id = new.shift_id;

  select (s.start_time at time zone 'Asia/Tokyo') - interval '6 days',
         (s.end_time   at time zone 'Asia/Tokyo')
  into win_start, win_end
  from shifts s
  where s.id = new.shift_id;

  select coalesce(sum(extract(epoch from (s.end_time - s.start_time))/3600.0), 0)
  into used_hours
  from shift_assignments sa
  join shifts s on s.id = sa.shift_id
  where sa.employee_id = new.employee_id
    and sa.status = 'assigned'
    and (s.start_time at time zone 'Asia/Tokyo') >= win_start
    and (s.start_time at time zone 'Asia/Tokyo') <= win_end;

  if used_hours + new_hours > cap then
    raise exception 'Rolling 7-day cap exceeded: cap=%, used=%, new=%, window=% to %',
      cap, used_hours, new_hours, win_start, win_end
      using errcode = '23514';
  end if;

  return new;
end
$$ language plpgsql;

drop trigger if exists check_rolling_7d_cap on shift_assignments;
create trigger check_rolling_7d_cap
before insert on shift_assignments
for each row execute function trg_check_rolling_7d_cap();
