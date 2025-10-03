-- 役割マスタ
insert into roles (code, name) values
  ('kitchen','キッチン'),
  ('hall','ホール')
on conflict (code) do nothing;

-- 管理ユーザー（パスワードはダミー。後で本物のハッシュに差し替え）
insert into users (username, password_hash, role)
values ('manager', '$2b$10$abcdefghijklmnopqrstuv', 'admin')
on conflict (username) do nothing;

-- 従業員 2名（店長 + アルバイト）
insert into employees (user_id, employee_code, name, employment_type, status, hire_date,
                       proficiency_level, hourly_wage, is_international_student, weekly_hour_cap)
values
  ((select id from users where username='manager'), 'MGR001', '店長 太郎', 'full_time','active','2024-04-01',3,1500,false,null),
  (null, 'EMP001', '山田 花子', 'part_time','active','2025-01-01',1,1100,true,28)
on conflict (employee_code) do nothing;

-- 従業員のロール付与
insert into employee_roles (employee_id, role_id, level, active)
select e.id, r.id, 2, true
from employees e
join roles r on r.code in ('register','hall')
where e.employee_code='EMP001'
on conflict do nothing;

-- 直近のシフト 1本 + 要員要件（register 1名）
with s as (
  insert into shifts(start_time,end_time)
  values ('2025-10-01 09:00+09','2025-10-01 13:00+09')
  returning id
)
insert into shift_requirements(shift_id,role_id,capacity)
select s.id, (select id from roles where code='register'), 1 from s
on conflict do nothing;

-- 割当（EMP001 を register にアサイン）
insert into shift_assignments(shift_id,employee_id,role_id,status)
select s.id, e.id, (select id from roles where code='register'), 'assigned'
from shifts s
join employees e on e.employee_code='EMP001'
where s.start_time='2025-10-01 09:00+09'
on conflict do nothing;

-- 月次目標（EMP001 に10月の目標）
insert into employee_targets(employee_id, month, target_amount, note)
select e.id, date '2025-10-01', 120000, '初期目標'
from employees e where e.employee_code='EMP001'
on conflict do nothing;
