import React, { useEffect, useMemo, useState } from "react";
import "./AllShift.css"; // 新規CSS（ShiftApply.css のトークンを再利用）

// ========= ユーティリティ =========
const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const pad2 = (n) => n.toString().padStart(2, "0");
const ymd = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const ym = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const parseYmd = (s) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};
const endOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date, delta) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
};

// ========= ダミーAPI（実運用では fetch に置き換え） =========
/**
 * 返り値: Array<{ id, employeeId, employeeName, role: 'ホール'|'キッチン', date:'YYYY-MM-DD', start:'HH:MM', end:'HH:MM', status:'approved'|'pending'|'rejected' }>
 */
async function fetchAllShifts({ month, role }) {
  // 例）GET /api/shifts?month=YYYY-MM&role=ホール
  // const res = await fetch(`/api/shifts?month=${month}&role=${encodeURIComponent(role)}`);
  // return await res.json();
  await new Promise((r) => setTimeout(r, 200));

  // デモデータ作成
  const base = new Date(
    Number(month.split("-")[0]),
    Number(month.split("-")[1]) - 1,
    1
  );
  const make = (empId, name, r, day, st, en, status = "approved") => ({
    id: `${empId}-${day}-${st}`,
    employeeId: empId,
    employeeName: name,
    role: r,
    date: ymd(new Date(base.getFullYear(), base.getMonth(), day)),
    start: st,
    end: en,
    status,
  });
  const demo = [
    // ホール
    make("E01", "佐藤", "ホール", 1, "10:00", "18:00"),
    make("E02", "田中", "ホール", 2, "12:00", "20:00", "pending"),
    make("E03", "鈴木", "ホール", 6, "09:00", "15:00"),
    make("E01", "佐藤", "ホール", 14, "10:00", "17:00"),
    make("E02", "田中", "ホール", 18, "12:00", "16:00"),
    make("E03", "鈴木", "ホール", 22, "09:00", "13:00", "rejected"),
    make("E04", "高橋", "ホール", 28, "17:00", "22:00"),
    // キッチン
    make("E11", "小林", "キッチン", 3, "08:00", "14:00"),
    make("E12", "山本", "キッチン", 5, "11:00", "19:00"),
    make("E13", "渡辺", "キッチン", 12, "13:00", "21:00", "pending"),
    make("E11", "小林", "キッチン", 17, "08:00", "14:00"),
    make("E12", "山本", "キッチン", 20, "11:00", "19:00"),
    make("E13", "渡辺", "キッチン", 26, "13:00", "21:00"),
  ];
  return demo.filter((d) => (role === "ALL" ? true : d.role === role));
}

// ========= 行列構築ユーティリティ =========
function buildMatrix(items, startDay, endDay, viewMonth) {
  // dayKeys: ['YYYY-MM-01', ...]
  const dayKeys = [];
  for (let d = startDay; d <= endDay; d++) {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
    dayKeys.push(ymd(date));
  }

  // employeeName順で行を作る
  const byEmp = new Map(); // name -> { id, name, cells: Map(dayKey -> [shifts]) }
  for (const it of items) {
    if (!byEmp.has(it.employeeName))
      byEmp.set(it.employeeName, {
        id: it.employeeId,
        name: it.employeeName,
        cells: new Map(),
      });
    const row = byEmp.get(it.employeeName);
    if (!row.cells.has(it.date)) row.cells.set(it.date, []);
    row.cells.get(it.date).push(it);
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
  const [role, setRole] = useState("ホール"); // 'ホール' | 'キッチン' | 'ALL'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const monthStr = ym(viewMonth);
  const eom = endOfMonth(viewMonth).getDate();
  const firstEnd = Math.min(15, eom);
  const secondStart = Math.min(16, eom + 1); // 16 or past EOM (no effect)
  const secondEnd = eom;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAllShifts({ month: monthStr, role });
        setItems(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [monthStr, role]);

  const firstHalf = useMemo(
    () => buildMatrix(items, 1, firstEnd, viewMonth),
    [items, firstEnd, viewMonth]
  );
  const secondHalf = useMemo(
    () => buildMatrix(items, secondStart, secondEnd, viewMonth),
    [items, secondStart, secondEnd, viewMonth]
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
