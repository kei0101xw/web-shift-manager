import { Router } from "express";
import { z } from "zod";
import { pool, withTx } from "../db/client";
import { sendPgError } from "../errors";

export const availabilityRouter = Router();

const isoTz = z.string().datetime({ offset: true });

const CreateSchema = z
  .object({
    employee_id: z.number().int().positive(),
    start_time: isoTz,
    end_time: isoTz,
    note: z.string().max(255).optional(),
  })
  .refine(
    (v) => new Date(v.end_time).getTime() > new Date(v.start_time).getTime(),
    {
      path: ["end_time"],
      message: "end_time must be greater than start_time",
    }
  );

const PatchSchema = z
  .object({
    start_time: isoTz.optional(),
    end_time: isoTz.optional(),
    note: z.string().max(255).nullable().optional(),
  })
  .refine(
    (v) => {
      if (!v.start_time || !v.end_time) return true;
      return new Date(v.end_time).getTime() > new Date(v.start_time).getTime();
    },
    { path: ["end_time"], message: "end_time must be greater than start_time" }
  );

const QuerySchema = z.object({
  employee_id: z.coerce.number().int().optional(),
  from: isoTz.optional(),
  to: isoTz.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

/** POST /availability */
availabilityRouter.post("/", async (req, res) => {
  try {
    const { employee_id, start_time, end_time, note } = CreateSchema.parse(
      req.body
    );
    const {
      rows: [row],
    } = await withTx((c) =>
      c.query(
        `insert into availability_requests (employee_id, start_time, end_time, note)
         values ($1::int, $2::timestamptz, $3::timestamptz, $4)
         returning id, employee_id, start_time, end_time, note`,
        [employee_id, start_time, end_time, note ?? null]
      )
    );
    res.status(201).json(row);
  } catch (err) {
    // 23P01 = exclusion_violation → 重複提出（時間帯オーバーラップ）
    return sendPgError(res, err);
  }
});

/** GET /availability */
availabilityRouter.get("/", async (req, res) => {
  try {
    const q = QuerySchema.parse(req.query);
    const wh: string[] = [];
    const params: any[] = [];

    if (q.employee_id) {
      params.push(q.employee_id);
      wh.push(`ar.employee_id = $${params.length}`);
    }
    if (q.from) {
      params.push(q.from);
      wh.push(`ar.start_time >= $${params.length}::timestamptz`);
    }
    if (q.to) {
      params.push(q.to);
      wh.push(`ar.end_time   <= $${params.length}::timestamptz`);
    }

    const offset = (q.page - 1) * q.limit;
    params.push(q.limit, offset);

    const { rows } = await pool.query(
      `select ar.id, ar.employee_id, ar.start_time, ar.end_time, ar.note
         from availability_requests ar
        ${wh.length ? "where " + wh.join(" and ") : ""}
        order by ar.start_time
        limit $${params.length - 1} offset $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    return sendPgError(res, err);
  }
});

/** PATCH /availability/:id */
availabilityRouter.patch("/:id", async (req, res) => {
  try {
    const id = z.coerce.number().int().parse(req.params.id);
    const body = PatchSchema.parse(req.body);

    // 動的SET
    const sets: string[] = [];
    const params: any[] = [];
    if (body.start_time) {
      params.push(body.start_time);
      sets.push(`start_time = $${params.length}::timestamptz`);
    }
    if (body.end_time) {
      params.push(body.end_time);
      sets.push(`end_time   = $${params.length}::timestamptz`);
    }
    if (body.note !== undefined) {
      params.push(body.note);
      sets.push(`note = $${params.length}`);
    }
    if (sets.length === 0)
      return res.status(400).json({ error: "nothing_to_update" });

    params.push(id);
    const {
      rows: [row],
    } = await pool.query(
      `update availability_requests
          set ${sets.join(", ")}
        where id = $${params.length}
        returning id, employee_id, start_time, end_time, note`,
      params
    );
    if (!row) return res.status(404).json({ error: "not_found" });
    res.json(row);
  } catch (err) {
    return sendPgError(res, err);
  }
});

/** DELETE /availability/:id */
availabilityRouter.delete("/:id", async (req, res) => {
  try {
    const id = z.coerce.number().int().parse(req.params.id);
    const { rowCount } = await pool.query(
      `delete from availability_requests where id=$1`,
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: "not_found" });
    res.status(204).send();
  } catch (err) {
    return sendPgError(res, err);
  }
});
