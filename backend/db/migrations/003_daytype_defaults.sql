-- 祝日テーブル（空でOK：入れなければ holiday 判定は起きない）
create table if not exists holidays (
  dt   date primary key,
  name varchar(80) not null
);

-- 平日/週末/祝日 × 時間帯の既定要件（capacity は「必要最小人数」）
create table if not exists requirement_defaults (
  day_type    varchar(16) not null check (day_type in ('weekday','weekend','holiday')),
  start_local time not null,
  end_local   time not null,
  role_id     int not null references roles(id) on delete restrict,
  capacity    int not null check (capacity >= 0),
  primary key (day_type, start_local, end_local, role_id)
);
-- create index if not exists reqdef_daytime_idx
-- on requirement_defaults (day_type, start_local, end_local);

-- JST基準の曜日/祝日判定（祝日テーブルが空なら平日/週末のみになる）
create or replace function day_type_jp(ts timestamptz) returns varchar
language sql stable as $$
  select case
    when exists (
      select 1 from holidays h
      where h.dt = (ts at time zone 'Asia/Tokyo')::date
    ) then 'holiday'
    when extract(dow from (ts at time zone 'Asia/Tokyo')) in (0,6) then 'weekend'
    else 'weekday'
  end;
$$;


-- （任意）平日/週末のデフォルトを入れる場合の例：必要になったら入れてください
-- insert into requirement_defaults(day_type,start_local,end_local,role_id,capacity) values
-- ('weekday','09:00','12:00',1,2),
-- ('weekday','09:00','12:00',2,1),
-- ('weekend','14:00','18:00',1,2)
-- on conflict do nothing;
