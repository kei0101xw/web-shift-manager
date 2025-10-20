import React, { useMemo, useState } from "react";
import "./TodayShift.css";

const dayStart = "09:00";
const dayEnd = "22:00";
const TICK_STEP_MIN = 60;

// ダミーデータ
const shifts = [
  { id: 1, role: "ホール", name: "佐藤", start: "09:00", end: "13:00" },
  { id: 2, role: "ホール", name: "田中", start: "12:00", end: "18:00" },
  { id: 3, role: "ホール", name: "鈴木", start: "17:00", end: "22:00" },
  { id: 4, role: "キッチン", name: "高橋", start: "09:30", end: "14:00" },
  { id: 5, role: "キッチン", name: "伊藤", start: "11:00", end: "20:00" },
  { id: 6, role: "キッチン", name: "中村", start: "18:00", end: "22:00" },
];

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const calcBarStyle = (start, end) => {
  const rangeStart = toMinutes(dayStart);
  const rangeEnd = toMinutes(dayEnd);
  const total = rangeEnd - rangeStart;
  const s = Math.max(toMinutes(start), rangeStart);
  const e = Math.min(toMinutes(end), rangeEnd);
  const left = ((s - rangeStart) / total) * 100;
  const width = Math.max(0, ((e - s) / total) * 100);
  return { left: `${left}%`, width: `${width}%` };
};

function todayLabelJST() {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(new Date());
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const d = parts.find((p) => p.type === "day")?.value ?? "";
  const w = parts.find((p) => p.type === "weekday")?.value ?? "";
  return `${m}月${d}日(${w})のシフト`;
}

export default function TodayShift() {
  const [selected, setSelected] = useState("ホール");

  const totalMinutes = toMinutes(dayEnd) - toMinutes(dayStart);
  const segments = totalMinutes / TICK_STEP_MIN;

  const filtered = useMemo(
    () =>
      shifts
        .filter((s) => s.role === selected)
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
    [selected]
  );

  const ticks = useMemo(() => {
    const start = toMinutes(dayStart);
    const end = toMinutes(dayEnd);
    const out = [];
    for (let t = start; t <= end; t += TICK_STEP_MIN) {
      const h = String(Math.floor(t / 60)).padStart(2, "0");
      const m = String(t % 60).padStart(2, "0");
      const left = ((t - start) / (end - start)) * 100;
      out.push({ label: `${h}:${m}`, left });
    }
    return out;
  }, []);

  const rootClass = "today-shift-root";

  return (
    <div className={rootClass} style={{ "--segments": segments }}>
      <div className="today-shift-header">
        <div className="today-shift-title">{todayLabelJST()}</div>

        <div className="today-shift-buttons">
          <button
            className={`today-shift-button today-shift-button--left ${
              selected === "ホール" ? "active" : ""
            }`}
            onClick={() => setSelected("ホール")}
          >
            ホール
          </button>
          <button
            className={`today-shift-button today-shift-button--right ${
              selected === "キッチン" ? "active" : ""
            }`}
            onClick={() => setSelected("キッチン")}
          >
            キッチン
          </button>
        </div>
      </div>

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
                  style={calcBarStyle(s.start, s.end)}
                  aria-label={`${s.name}の勤務時間 ${s.start}〜${s.end}`}
                  role="img"
                />
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="today-shift-empty">該当するシフトはありません。</div>
        )}
      </div>
    </div>
  );
}
