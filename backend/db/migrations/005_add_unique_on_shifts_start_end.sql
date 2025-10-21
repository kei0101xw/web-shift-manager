-- shifts の (start_time, end_time) をユニークにして重複作成を防ぐ（idempotent）
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS ux_shifts_start_end
    ON shifts(start_time, end_time);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'ux_shifts_start_end creation skipped: %', SQLERRM;
END
$$;

-- 補助 index（ギャップ算出や validate/assign でよく使う）
CREATE INDEX IF NOT EXISTS idx_shift_requirements_shift_role
  ON shift_requirements(shift_id, role_id);

CREATE INDEX IF NOT EXISTS idx_sa_employee_status
  ON shift_assignments(employee_id, status);
