import React, { useMemo, useState } from "react";

/**
 * ShiftApply — アルバイトのシフト申請ページ
 * 機能:
 *  - カレンダーで日付をクリックして選択/解除
 *  - 選択した各日付に出勤可能な時間帯（開始/終了）を指定
 *  - 共通のデフォルト時間を一括適用
 *  - バリデーション（開始<終了）
 *  - 申請ボタンで申請ペイロードを生成（console.log）
 *
 * 依存: 純粋な React のみ（date-fns 等は不使用）
 * スタイル: 最低限のインライン + クラス名。Tailwind を使っている場合は className を置き換えてください。
 */

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
  // month: 0-11
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

const box = {
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
  },
  shadow: { boxShadow: "0 8px 24px rgba(0,0,0,0.06)" },
  btn: {
    base: {
      padding: "8px 12px",
      borderRadius: 10,
      border: "1px solid #e5e7eb",
      background: "#fff",
      cursor: "pointer",
    },
    primary: {
      background: "#10b981",
      color: "#fff",
      border: "1px solid #10b981",
    },
  },
};

export default function ShiftApply() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // 選択した日付ごとの時間帯
  // { 'YYYY-MM-DD': { start: '09:00', end: '18:00', note: '' } }
  const [selected, setSelected] = useState({});

  // 一括適用用のデフォルト時間
  const [defaults, setDefaults] = useState({ start: "09:00", end: "18:00" });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-11
  const totalDays = daysInMonth(year, month);
  const firstDay = startOfMonth(year, month);
  const firstWeekday = firstDay.getDay(); // 0:日 - 6:土

  const grid = useMemo(() => {
    // カレンダー用セル（前月のプレースホルダ含む）
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null); // 前詰め
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    // 末尾の詰め（7の倍数に合わせる）
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

    // TODO: API 連携
    console.log("[ShiftApply] payload", payload);
    alert("シフト申請を受け付けました。コンソールに送信内容を出力しました。");
  };

  // UI
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        シフト申請
      </h1>

      {/* 上部: デフォルト時間 & 申請 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* カレンダー */}
        <section style={{ ...box.card, ...box.shadow, padding: 16 }}>
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <button
              aria-label="前の月"
              onClick={() => setViewDate((d) => addMonths(d, -1))}
              style={{ ...box.btn.base }}
            >
              ◀︎
            </button>
            <div style={{ fontWeight: 700 }}>
              {year}年 {month + 1}月
            </div>
            <button
              aria-label="次の月"
              onClick={() => setViewDate((d) => addMonths(d, 1))}
              style={{ ...box.btn.base }}
            >
              ▶︎
            </button>
          </header>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8,
              textAlign: "center",
              color: "#6b7280",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            {WEEK_LABELS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8,
            }}
          >
            {grid.map((d, idx) => {
              if (!d) return <div key={idx} />;
              const key = ymd(d);
              const selectedFlag = !!selected[key];
              const isToday = isSameDay(d, today);
              return (
                <button
                  key={key}
                  onClick={() => toggleDate(d)}
                  style={{
                    padding: 10,
                    minHeight: 44,
                    borderRadius: 10,
                    border: selectedFlag
                      ? "2px solid #10b981"
                      : "1px solid #e5e7eb",
                    background: selectedFlag ? "#ecfdf5" : "#fff",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  title={`${key} を${selectedFlag ? "解除" : "選択"}`}
                >
                  <div style={{ fontWeight: 600 }}>{d.getDate()}</div>
                  {isToday && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 8,
                        fontSize: 10,
                        color: "#2563eb",
                      }}
                    >
                      今日
                    </span>
                  )}
                  {selectedFlag && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 8,
                        fontSize: 10,
                        color: "#10b981",
                      }}
                    >
                      選択中
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 一括適用 & 申請 */}
        <section style={{ ...box.card, ...box.shadow, padding: 16 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>
            デフォルト時間（選択日に一括適用）
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                開始
              </label>
              <input
                type="time"
                value={defaults.start}
                step={900}
                onChange={(e) =>
                  setDefaults((p) => ({ ...p, start: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                終了
              </label>
              <input
                type="time"
                value={defaults.end}
                step={900}
                onChange={(e) =>
                  setDefaults((p) => ({ ...p, end: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={applyDefaultsToAll}
              style={{ ...box.btn.base, ...box.btn.primary }}
            >
              選択日に一括適用
            </button>
            <button
              onClick={() => setSelected({})}
              style={{ ...box.btn.base }}
              title="すべての選択をクリア"
            >
              クリア
            </button>
          </div>

          <hr
            style={{
              border: 0,
              borderTop: "1px solid #e5e7eb",
              margin: "16px 0",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ color: "#6b7280", fontSize: 14 }}>
              選択日: <b>{Object.keys(selected).length}</b> 件
            </div>
            <button
              onClick={onSubmit}
              style={{
                ...box.btn.base,
                ...box.btn.primary,
                padding: "10px 16px",
              }}
            >
              申請する
            </button>
          </div>
        </section>
      </div>

      {/* 下部: 日付ごとの詳細設定 */}
      <section
        style={{ ...box.card, ...box.shadow, padding: 16, marginTop: 16 }}
      >
        <h2 style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>
          日付ごとの時間帯
        </h2>
        {Object.keys(selected).length === 0 ? (
          <p style={{ color: "#6b7280" }}>
            カレンダーから日付を選択してください。
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.7fr 0.7fr 1fr 0.5fr",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 12, color: "#6b7280" }}>日付</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>開始</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>終了</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>メモ（任意）</div>
            <div />
            {Object.keys(selected)
              .sort()
              .map((key) => (
                <React.Fragment key={key}>
                  <div style={{ fontWeight: 600 }}>
                    {key} ({WEEK_LABELS[parseYmd(key).getDay()]})
                  </div>
                  <div>
                    <input
                      type="time"
                      value={selected[key].start}
                      step={900}
                      onChange={(e) => setTimeFor(key, "start", e.target.value)}
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={selected[key].end}
                      step={900}
                      onChange={(e) => setTimeFor(key, "end", e.target.value)}
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="例: 学校終わりなので18時以降可"
                      value={selected[key].note}
                      onChange={(e) => setTimeFor(key, "note", e.target.value)}
                      style={{
                        width: "100%",
                        padding: 8,
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => removeDate(key)}
                      style={{ ...box.btn.base }}
                    >
                      削除
                    </button>
                  </div>
                </React.Fragment>
              ))}
          </div>
        )}
      </section>

      {/* 補足: 実装メモ */}
      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer", color: "#6b7280" }}>
          実装メモ（API 連携の想定など）
        </summary>
        <ul style={{ color: "#6b7280", lineHeight: 1.8 }}>
          <li>
            onSubmit 内の <code>payload</code> は以下の形式:{" "}
            <code>
              [
              {`{ date: 'YYYY-MM-DD', start: 'HH:MM', end: 'HH:MM', note: string }`}
              ...]
            </code>
          </li>
          <li>
            fetch で <code>POST /api/shifts/apply</code>{" "}
            等に送信し、サーバ側でバリデーション・保存。
          </li>
          <li>
            選択の初期値は <strong>デフォルト時間</strong>{" "}
            を使用。予定により個別調整可能。
          </li>
          <li>
            拡張案:
            役割（ホール/キッチン）や拠点、上限時間、休憩自動計算、ドラッグで範囲選択など。
          </li>
        </ul>
      </details>
    </div>
  );
}
