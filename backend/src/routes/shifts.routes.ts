import { Router } from "express";
import { z } from "zod";
import { pool, withTx } from "../db/client";
// import { sendPgError } from "../errors";

export const shiftsRouter = Router();

const CreateShiftSchema = z.object({
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  requirements: z
    .array(
      z.object({
        role_id: z.number().int().positive(), //役職
        capacity: z.number().int().min(1), //必要な人数
      })
    )
    .default([]),
});

shiftsRouter.post("/", async (req, res) => {
  try {
    const body = CreateShiftSchema.parse(req.body);
    const { start_time, end_time, requirements } = body;

    const result = await withTx(async (c) => {
      const {
        rows: [shift],
      } = await c.query(
        `INSERT INTO shifts (start_time, end_time)
         VALUES ($1,$2)
         RETURNING id, start_time, end_time`,
        [start_time, end_time]
      );

      if (requirements.length > 0) {
        const params: any[] = [];
        const values: string[] = [];
        requirements.forEach((r, i) => {
          params.push(shift.id, r.role_id, r.capacity);
          values.push(
            `($${params.length - 2},$${params.length - 1},$${params.length})`
          );
        });
        await c.query(
          `INSERT INTO shift_requirements (shift_id, role_id, capacity)
           VALUES ${values.join(",")}
           ON CONFLICT (shift_id, role_id) DO UPDATE SET capacity = EXCLUDED.capacity`,
          params
        );
      }

      const { rows: reqs } = await c.query(
        `SELECT role_id, capacity FROM shift_requirements WHERE shift_id=$1 ORDER BY role_id`,
        [shift.id]
      );

      return { ...shift, requirements: reqs };
    });

    res.status(201).json(result);
  } catch (err) {
    sendPgError(res, err);
  }
});

shiftsRouter.get("/", async (req, res) => {
  try {
    const { from, to, role_id, with_requirements } = req.query as any;
    const params: any[] = [];
    const wh: string[] = [];
    if (from) {
      params.push(from);
      wh.push(`s.start_time >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      wh.push(`s.end_time   <= $${params.length}`);
    }
    if (role_id) {
      params.push(Number(role_id));
      wh.push(`sr.role_id = $${params.length}`);
    }

    const sql = `
      SELECT
        s.id, s.start_time, s.end_time,
        COALESCE(
          JSON_AGG(JSON_BUILD_OBJECT('role_id', sr.role_id, 'capacity', sr.capacity))
          FILTER (WHERE sr.role_id IS NOT NULL),
          '[]'
        ) AS requirements
      FROM shifts s
      LEFT JOIN shift_requirements sr ON sr.shift_id = s.id
      ${wh.length ? "WHERE " + wh.join(" AND ") : ""}
      GROUP BY s.id
      ORDER BY s.start_time
      LIMIT 1000
    `;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    sendPgError(res, err);
  }
});
