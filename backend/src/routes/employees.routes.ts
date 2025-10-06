import { Router } from "express";
import { query, withTx } from "../db/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendPgError } from "../errors";

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
});

const UpdateEmployeeSchema = z
  .object({
    name: z.string().min(1),
    employment_type: z.enum(["full_time", "part_time", "baito"]),
    status: z.enum(["active", "inactive", "suspended"]),
    hourly_wage: z.number().min(0).nullable(),
    is_international_student: z.boolean(),
    weekly_hour_cap: z.number().int().min(1).max(84).nullable(),
  })
  .partial(); // .partial()ですべてのフィールドを任意に

/** GET /api/v1/employees */
employeesRouter.get("/", async (_req, res) => {
  try {
    const rows = await query<{ id: number; name: string; status: string }>(
      `select id, name, status from employees order by id asc`
    );
    res.json(rows);
  } catch (e) {
    sendPgError(res, e);
  }
});

// GET /employees/:id
employeesRouter.get("/:id", async (req, res) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const rows = await query(
      `
      select id, employee_code, name, status, employment_type,
             hourly_wage::float8 as hourly_wage, weekly_hour_cap
        from employees
       where id = $1
    `,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "not_found" });
    res.json(rows[0]);
  } catch (e) {
    sendPgError(res, e);
  }
});

/** POST /api/v1/employees */
employeesRouter.post("/", async (req, res) => {
  try {
    const {
      name,
      password,
      employment_type,
      status,
      is_international_student,
      roles_by_code,
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
        `insert into employees (user_id, name, employee_code, hire_date, status, employment_type, is_international_student, weekly_hour_cap)
         values ($1, $2, $3, now()::date, $4, $5, $6, $7)
         returning id, employee_code, name, status, employment_type`,
        [
          user_id,
          name,
          employee_code,
          status,
          employment_type,
          is_international_student,
          weekly_hour_cap,
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
employeesRouter.patch("/:id", async (req, res) => {
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
