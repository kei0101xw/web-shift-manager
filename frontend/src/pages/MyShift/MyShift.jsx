import React, { useEffect, useMemo, useState } from "react";
import "./MyShift.css"; // 新規CSS（ShiftApply.cssのトークンを再利用）

// ---- ユーティリティ ----
const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const pad2 = (n) => n.toString().padStart(2, "0");
const ymd = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const ym = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const parseYmd = (s) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};
const addMonths = (date, delta) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
};

// ---- ダミーAPI（実運用では fetch に置き換え）----
async function fetchMyShifts({ from, to }) {
  // 例: GET /api/me/shifts?from=YYYY-MM-DD&to=YYYY-MM-DD
  // const res = await fetch(`/api/me/shifts?from=${from}&to=${to}`);
  // return await res.json();
  await new Promise((r) => setTimeout(r, 200));
  // デモデータ
  return [
    {
      id: 1,
      date: `${ymd(new Date())}`,
      start: "10:00",
      end: "15:00",
      role: "ホール",
      status: "approved",
    },
    {
      id: 2,
      date: `${ymd(new Date())}`,
      start: "18:00",
      end: "21:00",
      role: "キッチン",
      status: "pending",
    },
    {
      id: 3,
      date: `${ymd(addMonths(new Date(), 0))}`.replace(/-\d+$/, "-14"),
      start: "09:00",
      end: "13:30",
      role: "ホール",
      status: "approved",
    },
    {
      id: 4,
      date: `${ymd(addMonths(new Date(), 0))}`.replace(/-\d+$/, "-22"),
      start: "12:00",
      end: "20:00",
      role: "キッチン",
      status: "rejected",
    },
  ];
}

export default function MyShift() {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const range = useMemo(() => {
    const from = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const to = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    return { from: ymd(from), to: ymd(to) };
  }, [viewMonth]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchMyShifts(range);
        setItems(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [range.from, range.to]);

  const grouped = useMemo(() => {
    const filtered = items.filter(
      (it) =>
        (roleFilter === "all" || it.role === roleFilter) &&
        (statusFilter === "all" || it.status === statusFilter)
    );
    const map = new Map();
    for (const it of filtered) {
      if (!map.has(it.date)) map.set(it.date, []);
      map.get(it.date).push(it);
    }
    // 各日を開始時刻で並べ替え
    for (const arr of map.values()) {
      arr.sort((a, b) => a.start.localeCompare(b.start));
    }
    // 日付キーを昇順
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items, roleFilter, statusFilter]);

  const totalMinutes = useMemo(() => {
    const toMin = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    return grouped.reduce(
      (sum, [, arr]) =>
        sum + arr.reduce((s, it) => s + (toMin(it.end) - toMin(it.start)), 0),
      0
    );
  }, [grouped]);

  return (
    <div className="shift-list__container">
      <header className="shift-list__header">
        <div className="shift-list__title">自分のシフト</div>
        <div className="shift-list__controls">
          <button
            className="shift-list__nav"
            onClick={() => setViewMonth((d) => addMonths(d, -1))}
          >
            ◀︎
          </button>
          <div className="shift-list__month">
            {viewMonth.getFullYear()}年 {viewMonth.getMonth() + 1}月
          </div>
          <button
            className="shift-list__nav"
            onClick={() => setViewMonth((d) => addMonths(d, 1))}
          >
            ▶︎
          </button>
          <select
            className="shift-list__select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">すべての役割</option>
            <option value="ホール">ホール</option>
            <option value="キッチン">キッチン</option>
          </select>
          <select
            className="shift-list__select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">すべての状態</option>
            <option value="approved">承認済み</option>
            <option value="pending">承認待ち</option>
            <option value="rejected">否認</option>
          </select>
        </div>
      </header>

      <section className="shift-list__summary">
        <div>
          合計時間: <b>{(totalMinutes / 60).toFixed(1)}</b> 時間（
          {Math.round(totalMinutes)} 分）
        </div>
        <div>
          件数: <b>{items.length}</b>
        </div>
      </section>

      {loading ? (
        <div className="shift-list__skeleton">読み込み中...</div>
      ) : grouped.length === 0 ? (
        <div className="shift-list__empty">この月のシフトはありません。</div>
      ) : (
        <div className="shift-list__list">
          {grouped.map(([date, arr]) => (
            <div key={date} className="shift-list__day-card">
              <div className="shift-list__day-head">
                <div className="shift-list__day-title">
                  {date}（{WEEK[parseYmd(date).getDay()]}）
                </div>
              </div>
              <ul className="shift-list__items">
                {arr.map((it) => (
                  <li key={it.id} className="shift-list__item">
                    <div className="shift-list__time">
                      <span className="shift-list__time-start">{it.start}</span>
                      <span> - </span>
                      <span className="shift-list__time-end">{it.end}</span>
                    </div>
                    <div className="shift-list__meta">
                      <span className={`shift-list__badge role`}>
                        {it.role}
                      </span>
                      <span
                        className={`shift-list__badge status status--${it.status}`}
                      >
                        {it.status === "approved"
                          ? "承認済み"
                          : it.status === "pending"
                          ? "承認待ち"
                          : "否認"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
