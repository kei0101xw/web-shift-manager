import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { withTx } from "../db/client";
import { authGuard } from "../middleware/auth";

export const adminsRouter = Router();

function isAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "forbidden" });
  next();
}

const CreateAdminSchema = z.object({
  username: z.string().min(1),
  password: z
    .string()
    .min(8, "8文字以上")
    .regex(/[A-Z]/, "大文字を1つ以上")
    .regex(/[a-z]/, "小文字を1つ以上")
    .regex(/\d/, "数字を1つ以上"),
  employee_code: z.string().min(1),
  name: z.string().min(1),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

adminsRouter.post("/", authGuard, isAdmin, async (req, res) => {
  try {
    const { username, password, employee_code, name, hire_date } =
      CreateAdminSchema.parse(req.body);

    const created = await withTx(async (c) => {
      const hash = await bcrypt.hash(password, 10);
      const {
        rows: [u],
      } = await c.query(
        `insert into users (username, password_hash, role, is_active)
         values ($1,$2,'admin',true)
         returning id`,
        [username, hash]
      );
      const {
        rows: [e],
      } = await c.query(
        `insert into employees (user_id, employee_code, name, hire_date, employment_type, status, proficiency_level, is_international_student)
         values ($1,$2,$3,$4,'full_time','active',3,false)
         returning id, employee_code, name`,
        [u.id, employee_code, name, hire_date]
      );
      return { user_id: u.id, employee: e };
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: "create_admin_failed" });
  }
});
