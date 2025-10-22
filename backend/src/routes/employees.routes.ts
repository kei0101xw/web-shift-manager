import { Router } from "express";
import { query, withTx } from "../db/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendPgError } from "../errors";
import { authGuard, requireRole } from "../middleware/auth";

export const employeesRouter = Router();

const CreateEmployeeSchema = z.object({
  name: z.string().min(1),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
  employment_type: z.enum(["full_time", "part_time", "baito"]),
  status: z
    .enum(["active", "inactive", "suspended"])
    .optional()
    .default("active"),
  is_international_student: z.boolean().default(false),
  roles_by_code: z.array(z.string().min(1)).optional().default([]),
  work_area: z.enum(["キッチン", "ホール", "キッチン&ホール"]),
});

const UpdateEmployeeSchema = z
  .object({
    name: z.string().min(1),
    employment_type: z.enum(["full_time", "part_time", "baito"]),
    status: z.enum(["active", "inactive", "suspended"]),
    hourly_wage: z.number().min(0).nullable(),
    is_international_student: z.boolean(),
    weekly_hour_cap: z.number().int().min(1).max(84).nullable(),
    work_area: z.enum(["キッチン", "ホール", "キッチン&ホール"]).nullable(),
  })
  .partial(); // .partial()ですべてのフィールドを任意に

/** GET /api/v1/employees */
employeesRouter.get("/", async (req, res) => {
  try {
    const includeDeleted =
      String(req.query.include_deleted ?? "false") === "true";
    const orderParam = String(req.query.order ?? "name_asc");
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) ? Math.min(rawLimit, 500) : 100;

    const ORDER: Record<string, string> = {
      name_asc: "name ASC",
      name_desc: "name DESC",
      id_asc: "id ASC",
      id_desc: "id DESC",
    };
    const orderBy = ORDER[orderParam] ?? ORDER.name_asc;

    type Row = {
      id: number;
      employee_code: string;
      name: string;
      status: "active" | "inactive" | "suspended"; // ★ 追加
      work_area: string | null;
      employment_type: "full_time" | "part_time" | "baito";
    };
    const rows = await query<Row>(
      `
      SELECT id, employee_code, name, status, work_area, employment_type
        FROM employees
       WHERE $1::boolean = true OR deleted_at IS NULL
       ORDER BY ${orderBy}
       LIMIT $2
      `,
      [includeDeleted, limit]
    );

    const payload = rows.map((r) => ({
      id: r.id,
      employeeId: r.employee_code, // フロントの型に合わせる
      name: r.name,
      status: r.status,
      workArea: r.work_area ?? undefined,
      role:
        r.employment_type === "full_time"
          ? "社員"
          : r.employment_type === "part_time"
          ? "パート"
          : "アルバイト",
    }));

    res.json(payload);
  } catch (e) {
    sendPgError(res, e);
  }
});

// GET /employees/:id
employeesRouter.get("/:id", async (req, res) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const includeDeleted =
      String(req.query.include_deleted ?? "false") === "true";
    const rows = await query(
      `
  SELECT id, employee_code, name, status, employment_type,
         work_area, hourly_wage::float8 AS hourly_wage, weekly_hour_cap,
         deleted_at
    FROM employees
   WHERE id = $1
  `,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "not_found" });
    const r = rows[0];
    if (!includeDeleted && r.deleted_at)
      return res.status(404).json({ error: "not_found" });

    res.json({
      id: r.id,
      employeeId: r.employee_code,
      name: r.name,
      status: r.status,
      role:
        r.employment_type === "full_time"
          ? "社員"
          : r.employment_type === "part_time"
          ? "パート"
          : "アルバイト",
      workArea: r.work_area ?? null,
      hourly_wage: r.hourly_wage,
      weekly_hour_cap: r.weekly_hour_cap,
    });
  } catch (e) {
    sendPgError(res, e);
  }
});

/** POST /api/v1/employees */
employeesRouter.post("/", requireRole("admin"), async (req, res) => {
  try {
    const {
      name,
      password,
      employment_type,
      status,
      is_international_student,
      roles_by_code,
      work_area,
    } = CreateEmployeeSchema.parse(req.body);

    const password_hash = await bcrypt.hash(password, 10);
    const newEmployee = await withTx(async (c) => {
      const employee_code = `E-${String(
        Math.floor(Math.random() * 1e6)
      ).padStart(6, "0")}`;

      // usersテーブルにレコードを挿入し、IDを取得
      // usernameには一意な従業員コードを使うのが一般的
      const {
        rows: [newUser],
      } = await c.query(
        `INSERT INTO users (username, password_hash, role, is_active)
         VALUES ($1, $2, 'employee', true)
         RETURNING id`,
        [employee_code, password_hash]
      );
      const user_id = newUser.id;

      //取得したuser_idを使ってemployeesテーブルにレコードを挿入
      const weekly_hour_cap = is_international_student ? 28 : null;
      const {
        rows: [employee],
      } = await c.query(
        `insert into employees (user_id, name, employee_code, hire_date, status, employment_type, is_international_student, weekly_hour_cap, work_area)
         values ($1, $2, $3, now()::date, $4, $5, $6, $7, $8)
         returning id, employee_code, name, status, employment_type, work_area`,
        [
          user_id,
          name,
          employee_code,
          status,
          employment_type,
          is_international_student,
          weekly_hour_cap,
          work_area,
        ]
      );

      if (roles_by_code?.length) {
        const { rows: found } = await c.query(
          `select id, code from roles where code = any($1::text[])`,
          [roles_by_code]
        );
        if (found.length) {
          const params: any[] = [];
          const values: string[] = [];
          for (const r of found) {
            params.push(employee.id, r.id, 1, true);
            const n = params.length;
            values.push(`($${n - 3}, $${n - 2}, $${n - 1}, $${n})`);
          }
          await c.query(
            `insert into employee_roles (employee_id, role_id, level, active)
             values ${values.join(",")}
             on conflict (employee_id, role_id)
             do update set active=true, level=excluded.level`,
            params
          );
        }
      }

      const { rows: assigned } = await c.query(
        `select r.code, r.name, er.level, er.active
     from employee_roles er
     join roles r on r.id = er.role_id
    where er.employee_id = $1
    order by r.code`,
        [employee.id]
      );

      return { ...employee, roles: assigned };
    });

    res.status(201).json(newEmployee);
  } catch (e: any) {
    sendPgError(res, e);
  }
});

/** PATCH /api/v1/employees/:id  **/
employeesRouter.patch("/:id", requireRole("admin"), async (req, res) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = UpdateEmployeeSchema.parse(req.body);

    const values: any[] = [];
    const setClauses = Object.entries(body).map(([key, value]) => {
      values.push(value);
      return `${key} = $${values.length}`;
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    setClauses.push(`updated_at = now()`);
    values.push(id);

    const rows = await query(
      `update employees
         set ${setClauses.join(", ")}
       where id = $${values.length}
       returning id, employee_code, name, status, employment_type,
          work_area,
          hourly_wage::float8 as hourly_wage, weekly_hour_cap,
          is_international_student`,
      values
    );

    const updatedEmployee = rows[0];

    if (!updatedEmployee) {
      return res.status(404).json({ error: "not_found" });
    }
    res.json(updatedEmployee);
  } catch (e: any) {
    sendPgError(res, e);
  }
});

// 先頭で共通の正規化関数
const normalize = (s: string) =>
  s
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// DELETE /api/v1/employees/:id
employeesRouter.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = z
      .object({
        confirm_employee_code: z.string().min(1),
        confirm_name: z.string().min(1),
        hard: z.boolean().optional().default(false),
      })
      .parse(req.body);

    const [emp] = await query<{
      id: number;
      employee_code: string;
      name: string;
      deleted_at: string | null;
    }>(
      `SELECT id, employee_code, name, deleted_at FROM employees WHERE id = $1`,
      [id]
    );
    if (!emp) return res.status(404).json({ error: "not_found" });
    if (emp.deleted_at)
      return res.status(409).json({ error: "already_deleted" });

    // ★ 正規化して比較（大文字小文字も吸収したいなら toLowerCase も）
    if (
      normalize(emp.employee_code) !== normalize(body.confirm_employee_code) ||
      normalize(emp.name) !== normalize(body.confirm_name)
    ) {
      return res.status(400).json({ error: "mismatch" });
    }

    // 未消化のシフト割当があるかチェック（例）
    const [{ count }] = await query<{ count: string }>(
      `
        SELECT count(*)::int
          FROM shift_assignments sa
          JOIN shifts s ON s.id = sa.shift_id
         WHERE sa.employee_id = $1
           AND sa.status = 'assigned'
           AND s.end_time > now()
      `,
      [id]
    );
    if (Number(count) > 0) {
      return res.status(409).json({ error: "has_future_assignments" });
    }

    // ソフトデリート
    await query(
      `UPDATE employees SET deleted_at = now(), updated_at = now() WHERE id = $1`,
      [id]
    );
    return res.status(204).send();
  } catch (e) {
    sendPgError(res, e);
  }
});
