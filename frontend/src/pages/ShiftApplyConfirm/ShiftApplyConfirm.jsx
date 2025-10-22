import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ShiftApplyConfirm.css";
import { api } from "../../lib/api";
import { toIsoJst } from "../../utils/time";

const WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function parseYmd(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function ShiftConfirm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const payload = (state && state.payload) || [];
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    navigate("/shiftapply", { state: { payload } });
  };

  const handleSubmit = async () => {
    if (!payload?.length) return;

    setSubmitting(true);
    setError("");
    try {
      // POST /api/v1/me/availabilities/bulk
      // body: [{ date:"YYYY-MM-DD", start_time:"ISO+09:00", end_time:"ISO+09:00", note?:string }]
      const body = payload.map((p) => ({
        date: p.date,
        start_time: toIsoJst(p.date, p.start),
        end_time: toIsoJst(p.date, p.end),
        note: p.note || "",
      }));

      // 成功時 201 or 200 を想定
      const res = await api.post("/me/availabilities/bulk", body);
      const inserted =
        res?.inserted_or_upserted ?? res?.data?.inserted_or_upserted ?? 0;
      if (inserted <= 0) {
        setError(
          "申請が保存できませんでした。時間をおいて再度お試しください。"
        );
        return;
      }

      alert("申請を送信しました！");
      navigate("/home");
    } catch (e) {
      // APIが返すエラーコードや検証エラーを吸い上げる
      const code =
        e?.error ??
        e?.data?.error ??
        e?.response?.data?.error ??
        e?.response?.data?.code;
      const issues = e?.response?.data?.issues; // zod の validation_error など
      const msg =
        code === "time_overlap"
          ? "申請した時間帯が重なっています。時間を調整して再送信してください。"
          : code === "duplicate"
          ? "同一の時間帯が既に申請されています。"
          : e?.status === 401
          ? "未認証です。ログインし直してください。"
          : e?.status === 403
          ? "権限がありません（403）。"
          : e?.status === 422
          ? `入力が不正です。時間帯や日付を確認してください。\n${
              Array.isArray(issues)
                ? issues
                    .map((i) => `- ${i.path?.join(".")}: ${i.message}`)
                    .join("\n")
                : ""
            }`
          : "送信に失敗しました。時間をおいて再度お試しください。";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
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

        {error && <div className="shift-apply__error">{error}</div>}

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
          <button disabled={submitting} onClick={handleBack}>
            修正する
          </button>
          <button disabled={submitting} onClick={handleSubmit}>
            {submitting ? "送信中…" : "送信する"}
          </button>
        </div>
      </section>
    </div>
  );
}
