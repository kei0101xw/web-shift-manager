import { Router } from "express";
import { query } from "../db/client";

export const employeesRouter = Router();

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
