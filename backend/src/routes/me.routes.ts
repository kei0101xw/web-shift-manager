import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/client";
import { sendPgError } from "../errors";

export const meRouter = Router();

const Query = z
  .object({
    period: z
      .string()
      .regex(/^\d{4}-\d{2}-(H1|H2)$/)
      .optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    with_roles: z.coerce.boolean().optional().default(false),
    role_code: z.string().max(30).optional(),
  })
  .refine(
    (v) => v.period || (v.from && v.to && new Date(v.to) > new Date(v.from)),
    { message: "Provide period or valid from/to", path: ["to"] }
  );

function halfMonthRangeJST(period: string) {
  const m = /^(\d{4})-(\d{2})-(H1|H2)$/.exec(period)!;
  const [, yStr, moStr, half] = m;
  const y = Number(yStr),
    mo = Number(moStr);
  const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const fromDay = half === "H1" ? 1 : 16;
  const toDay = half === "H1" ? 15 : last;
  const pad = (n: number) => String(n).padStart(2, "0");
  const from = `${yStr}-${moStr}-${pad(fromDay)}T00:00:00+09:00`;
  const to = `${yStr}-${moStr}-${pad(toDay)}T23:59:59+09:00`;
  return { from, to };
}

meRouter.get("/shifts", async (req: any, res) => {
  try {
    const q = Query.parse(req.query);

    // 本番はミドルウェアから取得、開発時は ?employee_id= でも可
    const employeeId: number | undefined =
      req.user?.employee_id ??
      req.auth?.employee_id ??
      (req.query.employee_id && Number(req.query.employee_id));

    if (!employeeId) return res.status(401).json({ error: "unauthorized" });

    // 期間を確定
    let from = q.from,
      to = q.to;
    if (q.period) ({ from, to } = halfMonthRangeJST(q.period));

    const params: any[] = [];
    const wh: string[] = [];

    // 基本フィルタ
    params.push(employeeId);
    wh.push(`sa.employee_id = $${params.length}`);

    wh.push(`sa.status = 'assigned'`);

    params.push(from);
    wh.push(`s.start_time >= $${params.length}::timestamptz`);

    params.push(to);
    wh.push(`s.end_time   <= $${params.length}::timestamptz`);

    // 役割情報を付ける/絞る？
    const joinRoles = q.with_roles || !!q.role_code;
    if (q.role_code) {
      params.push(q.role_code);
      wh.push(`r.code = $${params.length}`);
    }

    const sql = `
      select
        sa.id as assignment_id,
        sa.shift_id,
        sa.role_id
        ${joinRoles ? ", r.code as role_code, r.name as role_name" : ""}
        , s.start_time, s.end_time
        , round(extract(epoch from (s.end_time - s.start_time))/3600.0, 2)::float8 as hours
        , (s.end_time <= now()) as is_completed
      from shift_assignments sa
      join shifts s on s.id = sa.shift_id
      ${joinRoles ? "join roles r on r.id = sa.role_id" : ""}
      where ${wh.join(" and ")}
      order by s.start_time;
    `;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    return sendPgError(res, err);
  }
});
