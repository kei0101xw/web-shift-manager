import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ShiftApplyConfirm.css";

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function parseYmd(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function ShiftConfirm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const payload = (state && state.payload) || [];

  const totalDays = payload.length;
  const summary = useMemo(() => {
    const minutes = payload.reduce((sum, p) => {
      const [sh, sm] = p.start.split(":").map(Number);
      const [eh, em] = p.end.split(":").map(Number);
      return sum + (eh * 60 + em - (sh * 60 + sm));
    }, 0);
    return { totalMinutes: minutes, totalHours: (minutes / 60).toFixed(1) };
  }, [payload]);

  const handleBack = () => {
    // 申請ページに payload を持って戻る（state 経由）
    navigate("/shiftapply", { state: { payload } });
  };

  const handleSubmit = async () => {
    console.log("[ShiftConfirm] submit payload", payload);
    alert("申請を送信しました！");
    navigate("/home");
  };

  if (!payload || payload.length === 0) {
    return (
      <div className="shift-apply__container">
        <section className="shift-apply__detail-card">
          <h2>申請内容の確認</h2>
          <p>申請データがありません。申請ページからやり直してください。</p>
          <div className="shift-apply__defaults-buttons">
            <button onClick={() => navigate("/shiftapply")}>
              申請ページへ
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="shift-apply__container">
      <h1 className="shift-apply__title">申請内容の確認</h1>

      <section className="shift-apply__detail-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h2>
            合計 {totalDays} 日 / 約 {summary.totalHours} 時間
          </h2>
          <div style={{ color: "#6b7280" }}>
            内容を確認し、問題なければ「送信する」を押してください。
          </div>
        </div>

        <div className="shift-apply__detail-grid" style={{ marginTop: 8 }}>
          <div>日付</div>
          <div>開始</div>
          <div>終了</div>
          <div>メモ</div>
          <div />
          {payload
            .sort((a, b) => (a.date < b.date ? -1 : 1))
            .map((p) => (
              <React.Fragment key={p.date}>
                <div>
                  {p.date} ({WEEK_LABELS[parseYmd(p.date).getDay()]})
                </div>
                <div>{p.start}</div>
                <div>{p.end}</div>
                <div>{p.note || "-"}</div>
                <div />
              </React.Fragment>
            ))}
        </div>

        <div className="shift-apply__submit-row">
          <button onClick={handleBack}>修正する</button>
          <button onClick={handleSubmit}>送信する</button>
        </div>
      </section>
    </div>
  );
}
