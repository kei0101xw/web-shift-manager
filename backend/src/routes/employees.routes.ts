import { Router } from "express";
import { query } from "../db/client";
import { z } from "zod";

export const employeesRouter = Router();

const PatchWageSchema = z.object({
  // null を許可すると「時給未設定に戻す」ことも可能
  hourly_wage: z.number().min(0).nullable(),
});

/** GET /api/v1/employees */
employeesRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await query<{ id: number; name: string; status: string }>(
      `select id, name, status from employees order by id asc`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/** POST /api/v1/employees */
employeesRouter.post("/", async (req, res, next) => {
  try {
    const { name, status = "active" } = req.body;
    // 最小バリデーション（必要なら zod 導入）
    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "`name` is required" });
    }
    const rows = await query<{ id: number; name: string; status: string }>(
      `insert into employees (name, employee_code, hire_date, status, employment_type)
       values ($1, concat('E', floor(random()*1e6)::int), now()::date, $2, 'part_time')
       returning id, name, status`,
      [name, status]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    // 一意制約などを簡易に返却（本格運用はエラーマッパを1箇所に）
    if (e.code === "23505")
      return res
        .status(409)
        .json({ code: "UNIQUE_VIOLATION", message: e.detail });
    res.status(500).json({ code: "INTERNAL_ERROR", message: e.message });
  }
});

/** PATCH /api/v1/employees/:id  — 時給の更新（最小） */
employeesRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = z.coerce.number().int().parse(req.params.id);
    const { hourly_wage } = PatchWageSchema.parse(req.body);

    const rows = await query<{
      id: number;
      name: string;
      status: string;
      hourly_wage: string | null;
    }>(
      `update employees
         set hourly_wage = $1,
             updated_at = now()
       where id = $2
       returning id, name, status, hourly_wage`,
      [hourly_wage, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "not_found" });
    }
    res.json(rows[0]);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res
        .status(422)
        .json({ error: "validation_error", issues: e.issues });
    }
    next(e);
  }
});
