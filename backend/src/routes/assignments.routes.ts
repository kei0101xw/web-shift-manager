import { Router } from "express";
import { z } from "zod";
import { pool, withTx } from "../db/client";
import { sendPgError } from "../errors";

export const assignmentsRouter = Router();

const CreateAssignmentSchema = z.object({
  shift_id: z.number().int().positive(),
  employee_id: z.number().int().positive(),
  role_id: z.number().int().positive(),
});

const GetAssignmentsQuery = z.object({
  shift_id: z.coerce.number().int().optional(),
  employee_id: z.coerce.number().int().optional(),
  role_id: z.coerce.number().int().optional(),
  status: z.enum(["assigned", "canceled"]).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

const PatchAssignmentSchema = z.object({
  status: z.enum(["assigned", "canceled"]),
});

const ValidateBody = z.object({
  candidates: z
    .array(
      z.object({
        shift_id: z.number().int().positive(),
        employee_id: z.number().int().positive(),
        role_id: z.number().int().positive(),
      })
    )
    .min(1),
});

assignmentsRouter.post("/", async (req, res, next) => {
  try {
    const { shift_id, employee_id, role_id } = CreateAssignmentSchema.parse(
      req.body
    );

    const result = await withTx(async (c) => {
      // 1) shift シフト存在チェック
      const {
        rows: [shift],
      } = await c.query(
        `select id, start_time, end_time from shifts where id = $1`,
        [shift_id]
      );
      if (!shift) {
        throw {
          name: "BadRequest",
          message: "shift_not_found",
          meta: { shift_id },
        };
      }

      // 2) シフト（shift_id, role_id）に“要件行（最小人数）”が存在するかを確認しつつ、現在の割当数を数える
      const {
        rows: [reqrow],
      } = await c.query(
        `select sr.capacity as required_min,
                coalesce(count(sa.id) filter (where sa.status='assigned'), 0) as assigned
           from shift_requirements sr
      left join shift_assignments sa
             on sa.shift_id = sr.shift_id
            and sa.role_id   = sr.role_id
            and sa.status    = 'assigned'
          where sr.shift_id = $1 and sr.role_id = $2
          group by sr.capacity`,
        [shift_id, role_id]
      );
      if (!reqrow) {
        // 要件行が無いならエラー（必要ならここで capacity=0 を自動作成に変更可）
        throw {
          name: "BadRequest",
          message: "requirement_not_found",
          meta: { shift_id, role_id },
        };
      }

      // 2.5) 同一シフト×同一従業員の重複（既に assigned があるか）
      const { rowCount: dup } = await c.query(
        `select 1
          from shift_assignments
          where shift_id = $1
            and employee_id = $2
            and status = 'assigned'
          limit 1`,
        [shift_id, employee_id]
      );
      if (dup) {
        const e: any = new Error("duplicate_assignment");
        e.name = "Conflict"; // ← 409 にしたいので Conflict を使う
        e.meta = { shift_id, employee_id };
        throw e;
      }

      // 3) 従業員ロールの権限
      const { rowCount: can } = await c.query(
        `select 1 from employee_roles where employee_id=$1 and role_id=$2 and active=true`,
        [employee_id, role_id]
      );
      if (!can) {
        throw {
          name: "BadRequest",
          message: "employee_role_inactive_or_missing",
          meta: { employee_id, role_id },
        };
      }

      // 4) 時間重複
      const { rowCount: overlap } = await c.query(
        `select 1
          from shift_assignments sa
          join shifts s2 on s2.id = sa.shift_id
          where sa.employee_id = $1
            and sa.status = 'assigned'
            and sa.shift_id <> $4                            -- ★ 同一シフトは除外
            and tstzrange(s2.start_time, s2.end_time, '[)')
                && tstzrange($2, $3, '[)')
          limit 1`,
        [employee_id, shift.start_time, shift.end_time, shift_id]
      );
      if (overlap) {
        const e: any = new Error("overlap_employee");
        e.name = "Conflict"; // ← 409に寄せたいなら Conflict に
        e.meta = { employee_id, shift_id };
        throw e;
      }

      // 5) insert (7日ローリング上限は DB トリガが判断)
      const {
        rows: [row],
      } = await c.query(
        `insert into shift_assignments (shift_id, employee_id, role_id, status)
         values ($1,$2,$3,'assigned')
         returning id, shift_id, employee_id, role_id, status`,
        [shift_id, employee_id, role_id]
      );

      // 6) warnings (under_min / surplus)
      const {
        rows: [after],
      } = await c.query(
        `select sr.capacity as required_min,
                coalesce(count(sa.id) filter (where sa.status='assigned'), 0) as assigned
           from shift_requirements sr
      left join shift_assignments sa
             on sa.shift_id = sr.shift_id
            and sa.role_id   = sr.role_id
            and sa.status    = 'assigned'
          where sr.shift_id = $1 and sr.role_id = $2
          group by sr.capacity`,
        [shift_id, role_id]
      );

      const requiredMin = Number(after.required_min);
      const assigned = Number(after.assigned);
      const warnings: any[] = [];
      if (assigned < requiredMin) {
        warnings.push({
          type: "under_min",
          required_min: requiredMin,
          assigned,
          remaining_needed: requiredMin - assigned,
        });
      } else if (assigned > requiredMin) {
        warnings.push({
          type: "surplus",
          required_min: requiredMin,
          assigned,
          surplus: assigned - requiredMin,
        });
      }

      return { ...row, warnings };
    });

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(422)
        .json({ error: "validation_error", issues: err.issues });
    }
    return sendPgError(res, err);
  }
});

assignmentsRouter.get("/", async (req, res, next) => {
  try {
    const q = GetAssignmentsQuery.parse(req.query);
    const params: any[] = [];
    const wh: string[] = [];

    if (q.shift_id) {
      params.push(q.shift_id);
      wh.push(`sa.shift_id = $${params.length}`);
    }
    if (q.employee_id) {
      params.push(q.employee_id);
      wh.push(`sa.employee_id = $${params.length}`);
    }
    if (q.role_id) {
      params.push(q.role_id);
      wh.push(`sa.role_id = $${params.length}`);
    }
    if (q.status) {
      params.push(q.status);
      wh.push(`sa.status = $${params.length}`);
    }
    if (q.from) {
      params.push(q.from);
      wh.push(`s.start_time >= $${params.length}::timestamptz`);
    }
    if (q.to) {
      params.push(q.to);
      wh.push(`s.end_time   <= $${params.length}::timestamptz`);
    }

    const offset = (q.page - 1) * q.limit;
    params.push(q.limit, offset);

    const sql = `
      select
        sa.id, sa.shift_id, sa.employee_id, sa.role_id, sa.status,
        s.start_time, s.end_time,
        extract(epoch from (s.end_time - s.start_time))/3600.0 as hours
      from shift_assignments sa
      join shifts s on s.id = sa.shift_id
      ${wh.length ? "where " + wh.join(" and ") : ""}
      order by s.start_time, sa.role_id, sa.employee_id
      limit $${params.length - 1} offset $${params.length}
    `;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

assignmentsRouter.patch("/:id", async (req, res) => {
  try {
    const id = z.coerce.number().int().parse(req.params.id);
    const { status } = PatchAssignmentSchema.parse(req.body);

    const {
      rows: [row],
    } = await pool.query(
      `update shift_assignments set status=$1 where id=$2
       returning id, shift_id, employee_id, role_id, status`,
      [status, id]
    );
    if (!row) {
      return res.status(404).json({ error: "not_found" });
    }
    res.json(row);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(422)
        .json({ error: "validation_error", issues: err.issues });
    }
    return sendPgError(res, err);
  }
});

assignmentsRouter.delete("/:id", async (req, res) => {
  try {
    const id = z.coerce.number().int().parse(req.params.id);
    const { rowCount } = await pool.query(
      `delete from shift_assignments where id=$1`,
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: "not_found" });
    res.status(204).send();
  } catch (err) {
    return sendPgError(res, err);
  }
});

/** ---------- POST /assignments/validate （事前検証・警告のみ） ---------- */
assignmentsRouter.post("/validate", async (req, res) => {
  try {
    const { candidates } = ValidateBody.parse(req.body);

    // ひとまずシンプルに候補ごと個別検証（要件の under/surplus は「参考」）
    const out = [];
    for (const cnd of candidates) {
      const item: any = { ...cnd, ok: true, errors: [], warnings: [] };

      // shift
      const {
        rows: [shift],
      } = await pool.query(
        `select id, start_time, end_time from shifts where id=$1`,
        [cnd.shift_id]
      );
      if (!shift) {
        item.ok = false;
        item.errors.push({ type: "shift_not_found" });
        out.push(item);
        continue;
      }

      // requirement
      const {
        rows: [reqrow],
      } = await pool.query(
        `select sr.capacity as required_min,
                coalesce(count(sa.id) filter (where sa.status='assigned'), 0) as assigned
           from shift_requirements sr
      left join shift_assignments sa
             on sa.shift_id = sr.shift_id
            and sa.role_id   = sr.role_id
            and sa.status    = 'assigned'
          where sr.shift_id = $1 and sr.role_id = $2
          group by sr.capacity`,
        [cnd.shift_id, cnd.role_id]
      );
      if (!reqrow) {
        item.ok = false;
        item.errors.push({ type: "requirement_not_found" });
      }

      // role active
      const { rowCount: can } = await pool.query(
        `select 1 from employee_roles where employee_id=$1 and role_id=$2 and active=true`,
        [cnd.employee_id, cnd.role_id]
      );
      if (!can) {
        item.ok = false;
        item.errors.push({ type: "employee_role_inactive_or_missing" });
      }

      // overlap
      const { rowCount: overlap } = await pool.query(
        `select 1
           from shift_assignments sa
           join shifts s2 on s2.id = sa.shift_id
          where sa.employee_id = $1
            and sa.status = 'assigned'
            and tstzrange(s2.start_time, s2.end_time, '[)') && tstzrange($2, $3, '[)')
          limit 1`,
        [cnd.employee_id, shift?.start_time, shift?.end_time]
      );
      if (overlap) {
        item.ok = false;
        item.errors.push({ type: "overlap_employee" });
      }

      // 7日ローリング cap（参考：DBトリガが最終判断）
      const {
        rows: [caprow],
      } = await pool.query(
        `select weekly_hour_cap from employees where id=$1`,
        [cnd.employee_id]
      );
      if (caprow?.weekly_hour_cap != null) {
        const {
          rows: [hours],
        } = await pool.query(
          `with win as (
             select (s.start_time at time zone 'Asia/Tokyo') as st_jst,
                    (s.end_time   at time zone 'Asia/Tokyo') as et_jst
               from shifts s where s.id = $1
           ), used as (
             select coalesce(sum(extract(epoch from (s.end_time - s.start_time))/3600.0), 0) as used_hours
               from shift_assignments sa
               join shifts s on s.id = sa.shift_id
               join win w on true
              where sa.employee_id = $2
                and sa.status='assigned'
                and (s.start_time at time zone 'Asia/Tokyo') >= (w.st_jst - interval '6 days')
                and (s.start_time at time zone 'Asia/Tokyo') <= w.et_jst
           )
           select used.used_hours as used_hours,
                  extract(epoch from ((select et_jst from win) - (select st_jst from win)))/3600.0 as new_hours`,
          [cnd.shift_id, cnd.employee_id]
        );
        const cap = Number(caprow.weekly_hour_cap);
        const used = Number(hours?.used_hours ?? 0);
        const add = Number(hours?.new_hours ?? 0);
        if (used + add > cap) {
          item.ok = false;
          item.errors.push({
            type: "would_exceed_rolling_cap",
            cap,
            used_hours: used,
            new_hours: add,
          });
        } else if (used + add > cap * 0.9) {
          item.warnings.push({
            type: "near_week_cap",
            cap,
            used_hours: used,
            new_hours: add,
          });
        }
      }

      // under_min / surplus（参考情報）
      if (reqrow) {
        const requiredMin = Number(reqrow.required_min);
        const assigned = Number(reqrow.assigned) + 1; // 仮にこの1件を入れる
        if (assigned < requiredMin) {
          item.warnings.push({
            type: "under_min",
            required_min: requiredMin,
            assigned,
            remaining_needed: requiredMin - assigned,
          });
        } else if (assigned > requiredMin) {
          item.warnings.push({
            type: "surplus",
            required_min: requiredMin,
            assigned,
            surplus: assigned - requiredMin,
          });
        }
      }

      out.push(item);
    }

    const ok = out.every((i) => i.ok);
    res.json({ ok, results: out });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(422)
        .json({ error: "validation_error", issues: err.issues });
    }
    return sendPgError(res, err);
  }
});
