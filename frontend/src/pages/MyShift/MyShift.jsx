// src/pages/MyShift/MyShift.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./MyShift.css";
import { api } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";

// ---- ユーティリティ ----
const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const pad2 = (n) => n.toString().padStart(2, "0");
const ymd = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseYmd = (s) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};
const addMonths = (date, delta) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
};

const toIsoStartJst = (yyyyMmDd) => `${yyyyMmDd}T00:00:00+09:00`;
const toIsoEndJst = (yyyyMmDd) => `${yyyyMmDd}T23:59:59+09:00`;

// ISO → "HH:MM"
const toHM = (isoOrHHMM) => {
  if (/^\d{2}:\d{2}$/.test(isoOrHHMM)) return isoOrHHMM;
  const d = new Date(isoOrHHMM);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export default function MyShift() {
  const { user } = useAuth(); // user.employee_id をフォールバックで利用
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [items, setItems] = useState([]); // { id, date, start, end, role, status }[]
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");

  const range = useMemo(() => {
    const from = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const to = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    return { from: ymd(from), to: ymd(to) };
  }, [viewMonth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const from = toIsoStartJst(range.from);
        const to = toIsoEndJst(range.to);

        // まずは通常通り /me/shifts を叩く
        let rows;
        try {
          rows = await api.get("/me/shifts", {
            params: { from, to, with_roles: true },
          });
        } catch (err) {
          // 開発中などで認証が未接続の場合のフォールバック
          // AuthContext に employee_id が居れば ?employee_id= を付けて再試行
          if (
            (err?.status === 401 || err?.status === 403) &&
            user?.employee_id
          ) {
            rows = await api.get("/me/shifts", {
              params: {
                from,
                to,
                with_roles: true,
                employee_id: user.employee_id,
              },
            });
          } else {
            throw err;
          }
        }

        // レスポンス正規化（バックエンドのフィールドに合わせてここで吸収）
        const normalized = (Array.isArray(rows) ? rows : []).map((r, i) => ({
          id:
            r.assignment_id ??
            r.id ??
            r.shift_id ??
            `${r.start_time}-${r.role_id ?? i}`,
          date: (r.start_time || "").slice(0, 10),
          start: toHM(r.start_time ?? r.start),
          end: toHM(r.end_time ?? r.end),
          role: r.role_name ?? r.role_code ?? r.role ?? "—",
          // 状態が未実装なら一旦 approved 固定にしておく（画面フィルタの互換のため）
          status: r.status ?? (r.is_completed ? "approved" : "approved"),
        }));

        if (!cancelled) setItems(normalized);
      } catch (e) {
        if (!cancelled) {
          const msg =
            e?.status === 401
              ? "未認証です。ログインし直してください。"
              : e?.status === 403
              ? "権限がありません（403）。"
              : e?.status === 500
              ? "サーバエラー（500）。"
              : "シフトの取得に失敗しました。時間をおいて再度お試しください。";
          setError(msg);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, user?.employee_id]);

  // 表示用グルーピング
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
    for (const arr of map.values()) {
      arr.sort((a, b) => a.start.localeCompare(b.start));
    }
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
      <div className="shift-list__title">自分のシフト</div>
      <header className="shift-list__header">
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
          <div className="shift-list_select">
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

      {error && <div className="shift-list__error">{error}</div>}

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
                      <span className="shift-list__badge role">{it.role}</span>
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
