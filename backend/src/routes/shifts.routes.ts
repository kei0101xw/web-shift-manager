import { Router } from "express";
import { z } from "zod";
import { pool, withTx } from "../db/client";
import { sendPgError } from "../errors";

export const shiftsRouter = Router();

const isoTz = z.string().datetime({ offset: true });
const CreateShiftSchema = z
  .object({
    start_time: isoTz,
    end_time: isoTz,
    requirements: z
      .array(
        z.object({
          role_id: z.number().int().positive(), //役職
          capacity: z.number().int().min(1), //必要な人数
        })
      )
      .default([]),
  })
  .refine(
    (v) => new Date(v.end_time).getTime() > new Date(v.start_time).getTime(),
    { path: ["end_time"], message: "end_time must be greater than start_time" }
  )
  .refine(
    (v) => {
      const ids = v.requirements.map((r) => r.role_id);
      return ids.length === new Set(ids).size;
    },
    { path: ["requirements"], message: "requirements.role_id must be unique" }
  );

shiftsRouter.post("/", async (req, res, next) => {
  try {
    const body = CreateShiftSchema.parse(req.body);
    const { start_time, end_time, requirements } = body;

    const result = await withTx(async (c) => {
      const {
        rows: [shift],
      } = await c.query(
        `INSERT INTO shifts (start_time, end_time)
         values ($1::timestamptz, $2::timestamptz)
         returning id, start_time, end_time`,
        [start_time, end_time]
      );

      //requirements 未指定/空なら、day_type & JST 時刻完全一致でデフォルト適用
      let reqsToUse = requirements;
      if (!reqsToUse || reqsToUse.length === 0) {
        const { rows: defs } = await c.query(
          `select role_id, capacity
             from requirement_defaults
            where day_type = day_type_jp($1)
              and start_local = ($1 at time zone 'Asia/Tokyo')::time
              and end_local   = ($2 at time zone 'Asia/Tokyo')::time
            order by role_id`,
          [start_time, end_time]
        );
        reqsToUse = defs; // 見つからなければ空＝要件なしシフトも作成可
      }

      if (reqsToUse.length > 0) {
        const rowsToInsert = reqsToUse.filter((r) => r.capacity > 0);
        if (rowsToInsert.length > 0) {
          const params: any[] = [];
          const values: string[] = [];
          for (const r of rowsToInsert) {
            params.push(shift.id, r.role_id, r.capacity);
            const n = params.length;
            values.push(`($${n - 2}, $${n - 1}, $${n})`);
          }
          await c.query(
            `INSERT INTO shift_requirements (shift_id, role_id, capacity)
            VALUES ${values.join(",")}
            on conflict (shift_id, role_id) do update
              set capacity = excluded.capacity`,
            params
          );
        }
      }

      const { rows: reqs } = await c.query(
        `select role_id, capacity
           from shift_requirements
          where shift_id = $1
          order by role_id`,
        [shift.id]
      );

      const defaults_applied = requirements.length === 0 && reqs.length > 0;

      return { ...shift, requirements: reqs, defaults_applied };
    });

    res.status(201).location(`/api/v1/shifts/${result.id}`).json(result);
  } catch (err) {
    next(err);
  }
});

const GetShiftsQuery = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  role_id: z.coerce.number().int().optional(),
  with_requirements: z.coerce.boolean().optional(), // "true"/"false" どちらでもOK
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  // role_filter_mode: "narrow" | "any" を将来足しても良い
});

shiftsRouter.get("/", async (req, res, next) => {
  try {
    const q = GetShiftsQuery.parse(req.query);
    const { from, to, role_id, with_requirements = true, page, limit } = q;

    const params: any[] = [];
    const wh: string[] = [];

    if (from) {
      params.push(from);
      wh.push(`s.start_time >= $${params.length}::timestamptz`);
    }
    if (to) {
      params.push(to);
      wh.push(`s.end_time   <= $${params.length}::timestamptz`);
    }

    // role_id の解釈：
    //  A) そのロールの要件だけが欲しい → JOIN + WHERE sr.role_id = ?
    //  B) そのロールが含まれるシフトを抽出しつつ「全要件」返す → EXISTS サブクエリ
    // 下は **B案（おすすめ）**：UIで gaps を見たいとき便利
    if (role_id) {
      params.push(role_id);
      wh.push(
        `exists (select 1 from shift_requirements x where x.shift_id = s.id and x.role_id = $${params.length})`
      );
    }

    const offset = (page - 1) * limit;

    if (!with_requirements) {
      // 軽量版：シフトだけ
      const sql = `
        select s.id, s.start_time, s.end_time
          from shifts s
         ${wh.length ? "where " + wh.join(" and ") : ""}
         order by s.start_time
         limit ${limit} offset ${offset}
      `;
      const { rows } = await pool.query(sql, params);
      return res.json(rows);
    }

    const sql = `
      select
        s.id, s.start_time, s.end_time,
        coalesce(
          json_agg(
            json_build_object('role_id', sr.role_id, 'capacity', sr.capacity)
            order by sr.role_id
          ) filter (where sr.role_id is not null),
          '[]'::json
        ) as requirements
      from shifts s
      left join shift_requirements sr
        on sr.shift_id = s.id
      ${wh.length ? "where " + wh.join(" and ") : ""}
      group by s.id, s.start_time, s.end_time
      order by s.start_time
      limit ${limit} offset ${offset}
    `;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});
