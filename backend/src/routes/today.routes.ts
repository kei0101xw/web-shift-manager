import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/client";
import { sendPgError } from "../errors";

export const todayRouter = Router();

const Query = z.object({
  role_id: z.coerce.number().int().optional(),
  role_code: z.string().max(30).optional(), // "kitchen" | "hall"
});

function todayRangeJST() {
  const now = new Date(); // サーバー現在時刻(UTC基準でOK)
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // JSTにシフト
  const yyyy = jst.getUTCFullYear();
  const mm = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jst.getUTCDate()).padStart(2, "0");
  const from = `${yyyy}-${mm}-${dd}T00:00:00+09:00`;
  const to = `${yyyy}-${mm}-${dd}T23:59:59+09:00`;
  return { from, to, date: `${yyyy}-${mm}-${dd}` };
}

todayRouter.get("/", async (req, res) => {
  try {
    const q = Query.parse(req.query);
    const { from, to, date } = todayRangeJST();

    const params: any[] = [from, to];
    let whRole = "";
    if (q.role_id) {
      params.push(q.role_id);
      whRole = `and exists (select 1 from shift_requirements x where x.shift_id = s.id and x.role_id = $${params.length})`;
    } else if (q.role_code) {
      params.push(q.role_code);
      whRole = `and exists (select 1 from shift_requirements x join roles r on r.id=x.role_id where x.shift_id = s.id and r.code = $${params.length})`;
    }

    const sql = `
      select
        s.id as shift_id, s.start_time, s.end_time,
        -- 要件
        coalesce((
          select json_agg(json_build_object('role_id', sr.role_id, 'capacity', sr.capacity, 'role_code', r.code, 'role_name', r.name) order by sr.role_id)
          from shift_requirements sr
          join roles r on r.id = sr.role_id
          where sr.shift_id = s.id
        ), '[]'::json) as requirements,
        -- 割当（当日のみ）
        coalesce((
          select json_agg(json_build_object('id', sa.id, 'employee_id', sa.employee_id, 'role_id', sa.role_id, 'name', e.name) order by sa.role_id, e.name)
          from shift_assignments sa
          join employees e on e.id = sa.employee_id
          where sa.shift_id = s.id and sa.status='assigned'
        ), '[]'::json) as assignments
      from shifts s
      where s.start_time >= $1::timestamptz
        and s.end_time   <= $2::timestamptz
        ${whRole}
      order by s.start_time;
    `;
    const { rows } = await pool.query(sql, params);

    // gaps をサーバ側で付与（capacity - assigned）
    const out = rows.map((row: any) => {
      const assignedByRole = new Map<number, number>();
      for (const a of row.assignments) {
        assignedByRole.set(a.role_id, (assignedByRole.get(a.role_id) ?? 0) + 1);
      }
      const slots = row.requirements.map((r: any) => {
        const assigned = (row.assignments as any[]).filter(
          (a) => a.role_id === r.role_id
        );
        const gap = (r.capacity as number) - assigned.length;
        return {
          role_id: r.role_id,
          role_code: r.role_code,
          role_name: r.role_name,
          capacity: r.capacity as number,
          assigned,
          gap: gap > 0 ? gap : 0,
        };
      });
      return {
        shift_id: row.shift_id,
        start_time: row.start_time,
        end_time: row.end_time,
        slots,
      };
    });

    res.json({ date, shifts: out });
  } catch (err) {
    return sendPgError(res, err);
  }
});
