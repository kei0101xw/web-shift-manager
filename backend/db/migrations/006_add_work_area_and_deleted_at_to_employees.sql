-- 追加列
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_area text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 既存の employee_code UNIQUE 制約を外す（名前は \d employees で確認）
-- 例: employees_employee_code_key という名前が多い
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_employee_code_key;

-- アクティブ（未削除）に対してのみユニーク
CREATE UNIQUE INDEX IF NOT EXISTS employees_employee_code_active_uniq
  ON employees(employee_code)
  WHERE deleted_at IS NULL;
