import React, { useEffect, useMemo, useState } from "react";
import "./AllShift.css";
import { api } from "../../lib/api";

// ========= ユーティリティ =========
const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const pad2 = (n: number) => n.toString().padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const ym = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const parseYmd = (s: string) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};
const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date: Date, delta: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
};

// JST(+09:00) で月初/月末の ISO を作る
const toIsoStartJst = (yyyyMmDd: string) => `${yyyyMmDd}T00:00:00+09:00`;
const toIsoEndJst = (yyyyMmDd: string) => `${yyyyMmDd}T23:59:59+09:00`;

// API → UI 用に正規化
type UiItem = {
  id: string | number;
  employeeId: number;
  employeeName: string;
  role: string; // "ホール" | "キッチン"
  date: string; // "YYYY-MM-DD"
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  status: "approved" | "pending" | "rejected";
};
const toHM = (iso: string) => {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

// ========= 行列構築ユーティリティ =========
function buildMatrix(items: UiItem[], startDay: number, endDay: number, viewMonth: Date) {
  // dayKeys: ['YYYY-MM-01', ...]
  const dayKeys: string[] = [];
  for (let d = startDay; d <= endDay; d++) {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
    dayKeys.push(ymd(date));
  }

  // employeeName順で行を作る
  const byEmp = new Map<
    string,
    { id: number | string; name: string; cells: Map<string, UiItem[]> }
  >();
  for (const it of items) {
    if (!byEmp.has(it.employeeName))
      byEmp.set(it.employeeName, {
        id: it.employeeId,
        name: it.employeeName,
        cells: new Map(),
      });
    const row = byEmp.get(it.employeeName)!;
    if (!row.cells.has(it.date)) row.cells.set(it.date, []);
    row.cells.get(it.date)!.push(it);
  }
  const rows = Array.from(byEmp.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "ja")
  );
  return { dayKeys, rows };
}

export default function AllShift() {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [role, setRole] = useState<"ホール" | "キッチン" | "ALL">("ホール");
  const [items, setItems] = useState<UiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const monthStr = ym(viewMonth);
  const eomDate = endOfMonth(viewMonth);
  const eom = eomDate.getDate();
  const firstEnd = Math.min(15, eom);
  const secondStart = Math.min(16, eom + 1);
  const secondEnd = eom;

  // ---- バックエンド取得 ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // 今月の JST 範囲
        const from = toIsoStartJst(`${monthStr}-01`);
        const to = toIsoEndJst(ymd(eomDate));

        // people と roles を一緒に返す
        // /api/v1/assignments?from=...&to=...&with_people=true&with_roles=true
        const rows = await api.get("/assignments", {
          params: {
            from,
            to,
            with_people: true,
            with_roles: true,
            // 役割でサーバ側絞り込みしたいなら role_code / role_id を付ける
            // role_code: role === "ALL" ? undefined : (role === "ホール" ? "hall" : "kitchen"),
          },
        });

        const normalized: UiItem[] = (Array.isArray(rows) ? rows : []).map(
          (r: any, i: number) => ({
            id: r.id ?? `${r.shift_id}-${r.employee_id}-${i}`,
            employeeId: r.employee_id,
            employeeName: r.employee_name ?? "不明",
            role: r.role_name ?? r.role_code ?? "不明",
            date: String(r.start_time).slice(0, 10),
            start: toHM(r.start_time),
            end: toHM(r.end_time),
            // いまは確定のみ返している想定なので "approved" に寄せる
            status:
              r.status === "pending"
                ? "pending"
                : r.status === "rejected"
                ? "rejected"
                : "approved",
          })
        );

        if (!cancelled) setItems(normalized);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.status === 401
              ? "未認証です。ログインし直してください。"
              : e?.status === 403
              ? "権限がありません（403）。"
              : "全体シフトの取得に失敗しました。時間をおいて再度お試しください。"
          );
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [monthStr]);

  // 役割フィルタ（フロント側）
  const filteredItems = useMemo(() => {
    if (role === "ALL") return items;
    return items.filter((it) => it.role === role);
  }, [items, role]);

  const firstHalf = useMemo(
    () => buildMatrix(filteredItems, 1, firstEnd, viewMonth),
    [filteredItems, firstEnd, viewMonth]
  );
  const secondHalf = useMemo(
    () => buildMatrix(filteredItems, secondStart, secondEnd, viewMonth),
    [filteredItems, secondStart, secondEnd, viewMonth]
  );

  return (
    <div className="shift-all__container">
      <header className="shift-all__header">
        <div className="shift-all__title">全体シフト</div>
        <div className="shift-all__controls">
          <button
            className="shift-all__nav"
            onClick={() => setViewMonth((d) => addMonths(d, -1))}
          >
            ◀︎
          </button>
          <div className="shift-all__month">
            {viewMonth.getFullYear()}年 {viewMonth.getMonth() + 1}月
          </div>
          <button
            className="shift-all__nav"
            onClick={() => setViewMonth((d) => addMonths(d, 1))}
          >
            ▶︎
          </button>

          <div className="shift-all__seg">
            <button
              className={`shift-all__seg-btn ${
                role === "ホール" ? "is-active" : ""
              }`}
              onClick={() => setRole("ホール")}
            >
              ホール
            </button>
            <button
              className={`shift-all__seg-btn ${
                role === "キッチン" ? "is-active" : ""
              }`}
              onClick={() => setRole("キッチン")}
            >
              キッチン
            </button>
            <button
              className={`shift-all__seg-btn ${
                role === "ALL" ? "is-active" : ""
              }`}
              onClick={() => setRole("ALL")}
            >
              ALL
            </button>
          </div>
        </div>
      </header>

      {error && <div className="shift-all__error">{error}</div>}

      {loading ? (
        <div className="shift-all__skeleton">読み込み中...</div>
      ) : (
        <>
          {/* 前半 */}
          <section className="shift-all__panel">
            <div className="shift-all__panel-title">
              前半（1〜{firstEnd}日）
            </div>
            <div className="shift-all__matrix-wrap">
              <table className="shift-all__matrix" role="table">
                <thead>
                  <tr>
                    <th className="shift-all__name-col">従業員</th>
                    {firstHalf.dayKeys.map((k) => {
                      const d = parseYmd(k);
                      return (
                        <th
                          key={k}
                          className={`shift-all__day-col ${
                            [0, 6].includes(d.getDay()) ? "is-weekend" : ""
                          }`}
                        >
                          <div className="shift-all__day-label">
                            {d.getDate()}
                          </div>
                          <div className="shift-all__dow">
                            {WEEK[d.getDay()]}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {firstHalf.rows.map((row) => (
                    <tr key={row.id}>
                      <th className="shift-all__name-col">{row.name}</th>
                      {firstHalf.dayKeys.map((k) => {
                        const list = row.cells.get(k) || [];
                        return (
                          <td
                            key={k}
                            className={`shift-all__cell ${
                              list.length ? "has" : ""
                            }`}
                          >
                            {list.length === 0 ? (
                              <span className="shift-all__empty">—</span>
                            ) : list.length === 1 ? (
                              <span
                                className={`shift-all__pill status--${list[0].status}`}
                              >
                                {list[0].start}–{list[0].end}
                              </span>
                            ) : (
                              <div className="shift-all__stack">
                                <span
                                  className={`shift-all__pill status--${list[0].status}`}
                                >
                                  {list[0].start}–{list[0].end}
                                </span>
                                <span className="shift-all__more">
                                  +{list.length - 1}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 後半 */}
          <section className="shift-all__panel">
            <div className="shift-all__panel-title">
              後半（{secondStart}〜{secondEnd}日）
            </div>
            <div className="shift-all__matrix-wrap">
              <table className="shift-all__matrix" role="table">
                <thead>
                  <tr>
                    <th className="shift-all__name-col">従業員</th>
                    {secondHalf.dayKeys.map((k) => {
                      const d = parseYmd(k);
                      return (
                        <th
                          key={k}
                          className={`shift-all__day-col ${
                            [0, 6].includes(d.getDay()) ? "is-weekend" : ""
                          }`}
                        >
                          <div className="shift-all__day-label">
                            {d.getDate()}
                          </div>
                          <div className="shift-all__dow">
                            {WEEK[d.getDay()]}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {secondHalf.rows.map((row) => (
                    <tr key={row.id}>
                      <th className="shift-all__name-col">{row.name}</th>
                      {secondHalf.dayKeys.map((k) => {
                        const list = row.cells.get(k) || [];
                        return (
                          <td
                            key={k}
                            className={`shift-all__cell ${
                              list.length ? "has" : ""
                            }`}
                          >
                            {list.length === 0 ? (
                              <span className="shift-all__empty">—</span>
                            ) : list.length === 1 ? (
                              <span
                                className={`shift-all__pill status--${list[0].status}`}
                              >
                                {list[0].start}–{list[0].end}
                              </span>
                            ) : (
                              <div className="shift-all__stack">
                                <span
                                  className={`shift-all__pill status--${list[0].status}`}
                                >
                                  {list[0].start}–{list[0].end}
                                </span>
                                <span className="shift-all__more">
                                  +{list.length - 1}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <footer className="shift-all__legend">
        <span className="shift-all__pill status--approved">承認済み</span>
        <span className="shift-all__pill status--pending">承認待ち</span>
        <span className="shift-all__pill status--rejected">否認</span>
      </footer>
    </div>
  );
}
