import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/client";
import { sendPgError } from "../errors";

export const gapsRouter = Router();

const QuerySchema = z.object({
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
  role_id: z.coerce.number().int().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
});

gapsRouter.get("/", async (req, res) => {
  try {
    const q = QuerySchema.parse(req.query);
    const params: any[] = [q.from, q.to];

    const whRole = q.role_id
      ? (params.push(q.role_id), `and sr.role_id = $3`)
      : "";

    const offset = (q.page - 1) * q.limit;
    params.push(q.limit, offset);

    const sql = `
      with agg as (
        select
          s.id as shift_id,
          s.start_time, s.end_time,
          sr.role_id,
          sr.capacity,
          coalesce(count(sa.id) filter (where sa.status='assigned'), 0) as assigned
        from shifts s
        join shift_requirements sr on sr.shift_id = s.id
        left join shift_assignments sa
              on sa.shift_id = sr.shift_id
              and sa.role_id  = sr.role_id
              and sa.status   = 'assigned'
        where s.start_time >= $1::timestamptz
          and s.end_time   <= $2::timestamptz
          ${whRole}
          -- 役割フィルタはそのまま（必要なら追加）
        group by s.id, s.start_time, s.end_time, sr.role_id, sr.capacity
      )
      select
        shift_id,
        role_id,
        capacity::int      as capacity,
        assigned::int      as assigned,
        (capacity - assigned)::int as gap,
        start_time, end_time
      from agg
      where (capacity - assigned) > 0
      order by start_time, role_id
      limit $${params.length - 1} offset $${params.length};
    `;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    return sendPgError(res, err);
  }
});
