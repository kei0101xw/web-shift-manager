import React, { useMemo, useState } from "react";
import "./TodayShift.css";

const dayStart = "09:00"; // タイムライン表示の開始
const dayEnd = "22:00"; // タイムライン表示の終了

const TICK_STEP_MIN = 60;

// ダミーデータ（必要に応じて追加・変更OK）
const shifts = [
  // ホール
  { id: 1, role: "ホール", name: "佐藤", start: "09:00", end: "13:00" },
  { id: 2, role: "ホール", name: "田中", start: "12:00", end: "18:00" },
  { id: 3, role: "ホール", name: "鈴木", start: "17:00", end: "22:00" },
  // キッチン
  { id: 4, role: "キッチン", name: "高橋", start: "08:30", end: "14:00" },
  { id: 5, role: "キッチン", name: "伊藤", start: "11:00", end: "20:00" },
  { id: 6, role: "キッチン", name: "中村", start: "18:00", end: "22:00" },
  // 以降はダミーの重複でもOK
  { id: 7, role: "ホール", name: "佐藤", start: "09:00", end: "13:00" },
  { id: 8, role: "ホール", name: "田中", start: "12:00", end: "18:00" },
  { id: 9, role: "ホール", name: "鈴木", start: "17:00", end: "22:00" },
  { id: 10, role: "キッチン", name: "高橋", start: "08:30", end: "14:00" },
  { id: 11, role: "キッチン", name: "伊藤", start: "11:00", end: "20:00" },
  { id: 12, role: "キッチン", name: "中村", start: "18:00", end: "22:00" },
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

const TodayShift = () => {
  const [selected, setSelected] = useState("ホール");

  const totalMinutes = toMinutes(dayEnd) - toMinutes(dayStart);
  const segments = totalMinutes / TICK_STEP_MIN;

  const filtered = useMemo(() => {
    return shifts
      .filter((s) => s.role === selected)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  }, [selected]);

  const ticks = useMemo(() => {
    const start = toMinutes(dayStart);
    const end = toMinutes(dayEnd);
    const out = [];
    for (let t = start; t <= end; t += TICK_STEP_MIN) {
      const h = String(Math.floor(t / 60)).padStart(2, "0");
      const m = String(t % 60).padStart(2, "0");
      out.push(`${h}:${m}`);
    }
    return out;
  }, []);

  // ★ 追加：役割に応じてテーマクラスを付与（CSS 変数が切り替わる）
  const rootClass = `shift-root ${
    selected === "キッチン" ? "is-kitchen" : "is-hall"
  }`;

  return (
    // ★ 追加：ルートにテーマクラス
    <div className={rootClass} style={{ "--segments": segments }}>
      <div className="shift-header">
        <div className="shift-title">4月25日(金)のシフト</div>

        <div className="shift-buttons">
          <button
            className={`shift-button shift-button--left ${
              selected === "ホール" ? "active" : ""
            }`}
            onClick={() => setSelected("ホール")}
          >
            ホール
          </button>
          <button
            className={`shift-button shift-button--right ${
              selected === "キッチン" ? "active" : ""
            }`}
            onClick={() => setSelected("キッチン")}
          >
            キッチン
          </button>
        </div>
      </div>

      {/* タイムラインのヘッダ（目盛り） */}
      <div className="timeline">
        <div className="timeline-track">
          {ticks.map((t) => (
            <div className="timeline-tick" key={t}>
              <span className="timeline-tick-label">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* シフト一覧 */}
      <div className="shift-list">
        {filtered.map((s) => (
          <div className="shift-card" key={s.id}>
            <div className="shift-card__header">
              <span className="shift-card__name">{s.name}</span>
            </div>

            <div className="shift-card__time">
              <span>{s.start}</span> 〜 <span>{s.end}</span>
            </div>

            <div className="shift-card__bar-wrap">
              <div className="shift-card__bar-bg" />
              {/* ★ 変更：色は共通クラス+CSS変数で制御 */}
              <div
                className="shift-card__bar shift-card__bar--accent"
                style={calcBarStyle(s.start, s.end)}
                aria-label={`${s.name}の勤務時間 ${s.start}〜${s.end}`}
                role="img"
              />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="shift-empty">該当するシフトはありません。</div>
        )}
      </div>
    </div>
  );
};

export default TodayShift;
