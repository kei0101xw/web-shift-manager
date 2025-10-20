-- availability_requests に status 列（pending/approved/rejected）を追加
alter table availability_requests
  add column if not exists status varchar(20) not null default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'availability_requests_status_chk'
  ) then
    alter table availability_requests
      add constraint availability_requests_status_chk
      check (status in ('pending','approved','rejected'));
  end if;
end$$;

-- (employee_id, start_time, end_time) ユニーク制約（UPSERT 用）
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'availability_requests_emp_start_end_uniq'
  ) then
    alter table availability_requests
      add constraint availability_requests_emp_start_end_uniq
      unique (employee_id, start_time, end_time);
  end if;
end$$;
