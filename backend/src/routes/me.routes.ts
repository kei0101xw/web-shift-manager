import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/client";
import { sendPgError } from "../errors";

export const meRouter = Router();

const Ym = z.string().regex(/^\d{4}-\d{2}$/);

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

function monthRangeJST(ym: string) {
  // ym = "YYYY-MM"
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr),
    m = Number(mStr);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); // 月末日
  const pad = (n: number) => String(n).padStart(2, "0");
  const from = `${yStr}-${mStr}-01T00:00:00+09:00`;
  const to = `${yStr}-${mStr}-${pad(last)}T23:59:59+09:00`;
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

/** GET /me/pay?month=YYYY-MM
 *  返り:
 *  {
 *    period: "YYYY-MM",
 *    hours: number,
 *    hourly_wage: number|null,
 *    amount: number,                         // hours * hourly_wage（wageがnullなら0）
 *    target: number|null,                    // 継承も考慮したその月のターゲット
 *    progress_percent: number|null,          // targetが無いときはnull
 *    target_source_month: "YYYY-MM"|null,    // その値が定義された元の月
 *    is_inherited: boolean                   // true=過去の月から継承
 *  }
 */
// GET /me/pay?month=YYYY-MM
meRouter.get("/pay", async (req: any, res) => {
  try {
    const month = Ym.parse(req.query.month);
    // 開発中の簡易認証（本番はミドルウェア経由で）
    const employeeId: number | undefined =
      req.user?.employee_id ??
      req.auth?.employee_id ??
      (req.query.employee_id && Number(req.query.employee_id));
    if (!employeeId) return res.status(401).json({ error: "unauthorized" });

    const { from, to } = monthRangeJST(month);

    // 勤務時間・時給・金額を計算（assignedのみ、JSTで当月範囲）
    const {
      rows: [pay],
    } = await pool.query(
      `
      with rng as (
    select $2::timestamptz as from_ts, $3::timestamptz as to_ts
  )
  select
    coalesce(
      sum(extract(epoch from (s.end_time - s.start_time))/3600.0)
      filter (where sa.status = 'assigned'),
      0
    )                       as hours,
    max(e.hourly_wage)      as hourly_wage -- ★ ここを集計に
  from shifts s
  join shift_assignments sa on sa.shift_id = s.id and sa.employee_id = $1
  join employees e on e.id = sa.employee_id
  join rng on true
  where s.start_time >= rng.from_ts
    and s.end_time   <= rng.to_ts
  `,
      [employeeId, from, to]
    );

    const hours = Number(pay?.hours ?? 0);
    const hourly_wage =
      pay?.hourly_wage != null ? Number(pay.hourly_wage) : null;
    const amount = hourly_wage != null ? Math.round(hours * hourly_wage) : 0;

    // 指定月の「継承ターゲット」を1件取得（= その月以前で最も新しいレコード）
    const {
      rows: [t],
    } = await pool.query(
      `
      select month::text as month_txt, target_amount::numeric
        from employee_targets
       where employee_id = $1
         and month <= ($2 || '-01')::date
       order by month desc
       limit 1
      `,
      [employeeId, month]
    );

    const target = t ? Number(t.target_amount) : null;
    const target_source_month = t ? String(t.month_txt).slice(0, 7) : null;
    const is_inherited = t ? target_source_month !== month : false;

    const progress_percent =
      target != null && target > 0
        ? Math.round((amount / target) * 1000) / 10
        : null; // 小数1桁

    res.json({
      period: month,
      hours: Math.round(hours * 100) / 100, // 小数2桁程度に丸め
      hourly_wage,
      amount, // hours * hourly_wage（wageがnullなら0）
      target, // 継承も考慮したその月のターゲット
      progress_percent, // targetが無いときはnull
      target_source_month, // その値が定義された元の月
      is_inherited, // true=過去の月から継承
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(422)
        .json({ error: "validation_error", issues: err.issues });
    }
    return sendPgError(res, err);
  }
});
