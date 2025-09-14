import React, { useMemo, useState } from "react";
import "./ShiftApply.css";

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function pad2(n) {
  return n.toString().padStart(2, "0");
}

function ymd(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

function parseYmd(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function startOfMonth(year, month) {
  return new Date(year, month, 1);
}

function addMonths(date, delta) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function ShiftApply() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selected, setSelected] = useState({});
  const [defaults, setDefaults] = useState({ start: "09:00", end: "18:00" });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const firstDay = startOfMonth(year, month);
  const firstWeekday = firstDay.getDay();

  const grid = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [firstWeekday, totalDays, year, month]);

  const isSelected = (date) => !!selected[ymd(date)];

  const toggleDate = (date) => {
    const key = ymd(date);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { start: defaults.start, end: defaults.end, note: "" };
      }
      return next;
    });
  };

  const applyDefaultsToAll = () => {
    setSelected((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = { ...next[k], start: defaults.start, end: defaults.end };
      });
      return next;
    });
  };

  const setTimeFor = (key, field, value) => {
    setSelected((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const removeDate = (key) => {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = () => {
    const errs = [];
    for (const [key, v] of Object.entries(selected)) {
      if (!v.start || !v.end) {
        errs.push(`${key}: 開始/終了のいずれかが未入力です`);
        continue;
      }
      if (v.start >= v.end) {
        errs.push(`${key}: 開始は終了より前にしてください`);
      }
    }
    return errs;
  };

  const onSubmit = () => {
    const errors = validate();
    if (errors.length) {
      alert(`入力エラー\n\n` + errors.join("\n"));
      return;
    }
    const payload = Object.keys(selected)
      .sort()
      .map((key) => ({ date: key, ...selected[key] }));

    console.log("[ShiftApply] payload", payload);
    alert("シフト申請を受け付けました。コンソールに送信内容を出力しました。");
  };

  return (
    <div className="shift-apply__container">
      <h1 className="shift-apply__title">シフト申請</h1>

      <div className="shift-apply__layout">
        <section className="shift-apply__calendar-card">
          <header className="shift-apply__calendar-header">
            <button onClick={() => setViewDate((d) => addMonths(d, -1))}>
              ◀︎
            </button>
            <div className="shift-apply__calendar-title">
              {year}年 {month + 1}月
            </div>
            <button onClick={() => setViewDate((d) => addMonths(d, 1))}>
              ▶︎
            </button>
          </header>

          <div className="shift-apply__week-labels">
            {WEEK_LABELS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div className="shift-apply__calendar-grid">
            {grid.map((d, idx) => {
              if (!d) return <div key={idx} />;
              const key = ymd(d);
              const selectedFlag = !!selected[key];
              const isToday = isSameDay(d, today);
              return (
                <button
                  key={key}
                  onClick={() => toggleDate(d)}
                  className={`shift-apply__calendar-day ${
                    selectedFlag ? "selected" : ""
                  } ${isToday ? "today" : ""}`}
                >
                  <div>{d.getDate()}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="shift-apply__defaults-card">
          <h2>デフォルト時間（選択日に一括適用）</h2>
          <div className="shift-apply__time-inputs">
            <div>
              <label>開始</label>
              <input
                type="time"
                value={defaults.start}
                onChange={(e) =>
                  setDefaults((p) => ({ ...p, start: e.target.value }))
                }
              />
            </div>
            <div>
              <label>終了</label>
              <input
                type="time"
                value={defaults.end}
                onChange={(e) =>
                  setDefaults((p) => ({ ...p, end: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="shift-apply__defaults-buttons">
            <button onClick={applyDefaultsToAll}>選択日に一括適用</button>
            <button onClick={() => setSelected({})}>クリア</button>
          </div>
          <div className="shift-apply__submit-row">
            <div>
              選択日: <b>{Object.keys(selected).length}</b> 件
            </div>
            <button onClick={onSubmit}>申請する</button>
          </div>
        </section>
      </div>

      <section className="shift-apply__detail-card">
        <h2>日付ごとの時間帯</h2>
        {Object.keys(selected).length === 0 ? (
          <p>カレンダーから日付を選択してください。</p>
        ) : (
          <div className="shift-apply__detail-grid">
            <div>日付</div>
            <div>開始</div>
            <div>終了</div>
            <div>メモ（任意）</div>
            <div />
            {Object.keys(selected)
              .sort()
              .map((key) => (
                <React.Fragment key={key}>
                  <div>
                    {key} ({WEEK_LABELS[parseYmd(key).getDay()]})
                  </div>
                  <div>
                    <input
                      type="time"
                      value={selected[key].start}
                      onChange={(e) => setTimeFor(key, "start", e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={selected[key].end}
                      onChange={(e) => setTimeFor(key, "end", e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="例: 学校終わりなので18時以降可"
                      value={selected[key].note}
                      onChange={(e) => setTimeFor(key, "note", e.target.value)}
                    />
                  </div>
                  <div>
                    <button onClick={() => removeDate(key)}>削除</button>
                  </div>
                </React.Fragment>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
