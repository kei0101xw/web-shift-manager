import React, { useEffect, useMemo, useState } from "react";
import "./TodayShift.css";
import { api } from "../../lib/api";

const DAY_START_DEFAULT = "09:00";
const DAY_END_DEFAULT = "22:00";
const TICK_STEP_MIN = 60;

// ---------- 時刻ユーティリティ ----------
const pad2 = (n) => String(n).padStart(2, "0");
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHM = (isoOrHHMM) => {
  if (/^\d{2}:\d{2}$/.test(isoOrHHMM)) return isoOrHHMM;
  const d = new Date(isoOrHHMM);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const jstRangeForToday = () => {
  // 今日の 00:00:00〜23:59:59 を JST(+09:00)のISOに
  const now = new Date();
  const y = now.getFullYear();
  const m = pad2(now.getMonth() + 1);
  const d = pad2(now.getDate());
  return {
    from: `${y}-${m}-${d}T00:00:00+09:00`,
    to: `${y}-${m}-${d}T23:59:59+09:00`,
    ymd: `${y}-${m}-${d}`,
  };
};
const todayLabelJST = () => {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(new Date());
  const mo = parts.find((p) => p.type === "month")?.value ?? "";
  const da = parts.find((p) => p.type === "day")?.value ?? "";
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
  return `${mo}月${da}日(${wd})のシフト`;
};

// タイムバーの left/width を % で返す
const calcBarStyle = (startHHMM, endHHMM, dayStart, dayEnd) => {
  const rangeStart = toMinutes(dayStart);
  const rangeEnd = toMinutes(dayEnd);
  const total = Math.max(1, rangeEnd - rangeStart);
  const s = Math.max(toMinutes(startHHMM), rangeStart);
  const e = Math.min(toMinutes(endHHMM), rangeEnd);
  const left = ((s - rangeStart) / total) * 100;
  const width = Math.max(0, ((e - s) / total) * 100);
  return { left: `${left}%`, width: `${width}%` };
};

export default function TodayShift() {
  const [selectedRole, setSelectedRole] = useState("ホール");
  const [items, setItems] = useState([]); // {id, role, name, start, end}[]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 表示レンジ（デフォルトは 09:00〜22:00。データに合わせて広げる）
  const [dayStart, setDayStart] = useState(DAY_START_DEFAULT);
  const [dayEnd, setDayEnd] = useState(DAY_END_DEFAULT);

  // ---- 取得 ----
  useEffect(() => {
    const { from, to } = jstRangeForToday();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        // ★ 推奨API（例）：/assignments?from=&to=&status=assigned&with_roles=true&with_employees=true
        // レスポンス例（flat）:
        // [{assignment_id, employee_name, role_name, start_time, end_time}, ...]
        // もしくは（shiftごとに assignees 配列）:
        // [{id, start_time, end_time, assignees: [{employee_name, role_name}, ...]}]
        let rows = await api.get("/assignments", {
          params: {
            from,
            to,
            // status: "assigned",
            with_roles: true,
            with_people: true,
          },
        });

        // もし上記APIがまだ無い場合のフォールバック（任意）:
        // rows = await api.get("/shifts", { params: { from, to, with_requirements: true } });

        const normalized = normalizeAssignments(rows);

        if (!cancelled) {
          setItems(normalized);

          // 表示レンジをデータに合わせて広げる（09:00〜22:00 をベースに拡張）
          const mins = normalized.flatMap((r) => [
            toMinutes(r.start),
            toMinutes(r.end),
          ]);
          if (mins.length) {
            const minHM = Math.min(...mins);
            const maxHM = Math.max(...mins);
            const startHM = Math.min(minHM, toMinutes(DAY_START_DEFAULT));
            const endHM = Math.max(maxHM, toMinutes(DAY_END_DEFAULT));
            setDayStart(
              `${pad2(Math.floor(startHM / 60))}:${pad2(startHM % 60)}`
            );
            setDayEnd(`${pad2(Math.floor(endHM / 60))}:${pad2(endHM % 60)}`);
          } else {
            setDayStart(DAY_START_DEFAULT);
            setDayEnd(DAY_END_DEFAULT);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.status === 401
              ? "未認証です。ログインし直してください。"
              : e?.status === 403
              ? "権限がありません（403）。"
              : "当日のシフト取得に失敗しました。時間をおいて再度お試しください。"
          );
          setItems([]);
          setDayStart(DAY_START_DEFAULT);
          setDayEnd(DAY_END_DEFAULT);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ロールごとの絞り込み & 時刻順
  const filtered = useMemo(() => {
    return items
      .filter((x) => x.role === selectedRole)
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [items, selectedRole]);

  // 目盛り
  const ticks = useMemo(() => {
    const start = toMinutes(dayStart);
    const end = toMinutes(dayEnd);
    const out = [];
    for (let t = start; t <= end; t += TICK_STEP_MIN) {
      const h = pad2(Math.floor(t / 60));
      const m = pad2(t % 60);
      const left = ((t - start) / Math.max(1, end - start)) * 100;
      out.push({ label: `${h}:${m}`, left });
    }
    return out;
  }, [dayStart, dayEnd]);

  const totalMinutes = toMinutes(dayEnd) - toMinutes(dayStart);
  const segments = totalMinutes / TICK_STEP_MIN;
  const rootClass = "today-shift-root";

  return (
    <div className={rootClass} style={{ "--segments": segments }}>
      <div className="today-shift-header">
        <div className="today-shift-title">{todayLabelJST()}</div>

        <div className="today-shift-buttons">
          <button
            className={`today-shift-button today-shift-button--left ${
              selectedRole === "ホール" ? "active" : ""
            }`}
            onClick={() => setSelectedRole("ホール")}
          >
            ホール
          </button>
          <button
            className={`today-shift-button today-shift-button--right ${
              selectedRole === "キッチン" ? "active" : ""
            }`}
            onClick={() => setSelectedRole("キッチン")}
          >
            キッチン
          </button>
        </div>
      </div>

      {/* 取得エラー */}
      {error && <div className="today-shift-error">{error}</div>}

      {/* タイムライン */}
      <div className="today-timeline">
        <div className="today-timeline-track">
          {ticks.map((t) => (
            <div
              className="today-timeline-tick"
              key={t.label}
              style={{ left: `${t.left}%` }}
            >
              <span className="today-timeline-tick-label">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* シフト一覧 */}
      {loading ? (
        <div className="today-shift-empty">読み込み中…</div>
      ) : filtered.length === 0 ? (
        <div className="today-shift-empty">該当するシフトはありません。</div>
      ) : (
        <div className="today-shift-list">
          {filtered.map((s) => (
            <div className="today-shift-card" key={s.id}>
              <div className="today-shift-card__header">
                <div className="today-shift-info">
                  <span className="today-shift-card__name">{s.name}</span>
                  <div className="today-shift-card__time">
                    <span>{s.start}</span> 〜 <span>{s.end}</span>
                  </div>
                </div>

                <div className="today-shift-card__bar-wrap">
                  <div className="today-shift-card__bar-bg" />
                  <div
                    className="today-shift-card__bar today-shift-card__bar--accent"
                    style={calcBarStyle(s.start, s.end, dayStart, dayEnd)}
                    aria-label={`${s.name}の勤務時間 ${s.start}〜${s.end}`}
                    role="img"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * APIレスポンスを UI 用の形へ正規化する
 * 期待する戻り値: { id, role, name, start, end }[]
 * - role: "ホール" / "キッチン"（バックエンドの role_name をそのまま表示する想定）
 */
function normalizeAssignments(rows) {
  if (!rows) return [];

  // 1) フラット（1行=1人割当）の形
  if (
    Array.isArray(rows) &&
    rows.length &&
    (rows[0].employee_name || rows[0].role_name)
  ) {
    return rows.map((r, i) => ({
      id: r.assignment_id ?? r.id ?? i,
      role: r.role_name ?? r.role ?? "不明",
      name: r.employee_name ?? r.name ?? "不明",
      start: toHM(r.start_time ?? r.start),
      end: toHM(r.end_time ?? r.end),
    }));
  }

  // 2) シフトごと（assignees配列）の形
  if (Array.isArray(rows) && rows.length && rows[0].assignees) {
    const out = [];
    rows.forEach((s) => {
      (s.assignees || []).forEach((a, idx) => {
        out.push({
          id: `${s.id}-${idx}`,
          role: a.role_name ?? a.role ?? "不明",
          name: a.employee_name ?? a.name ?? "不明",
          start: toHM(s.start_time ?? s.start),
          end: toHM(s.end_time ?? s.end),
        });
      });
    });
    return out;
  }

  // 不明スキーマは空扱い
  return [];
}
