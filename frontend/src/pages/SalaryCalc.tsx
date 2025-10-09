import React from "react";
import "./SalaryCalc.css";

type Props = {
  monthLabel?: string; // 表示する月（例: "2025年4月"）
  goalYen?: number; // 目標金額
  earnedYen?: number; // 今日までの給料
  workedMinutes?: number; // 勤務合計（分）
  estimatedYen?: number; // 今月の給料見込み
  onPrevMonth?: () => void; // ＜
  onNextMonth?: () => void; // ＞
  onBackToCurrent?: () => void; // 今月に戻る
};

const fmtYen = (n: number) => "¥" + Math.floor(n).toLocaleString("ja-JP");

const fmtHm = (totalMin: number) => {
  const h = Math.floor((totalMin || 0) / 60);
  const m = (totalMin || 0) % 60;
  return `${h}h${String(m).padStart(2, "0")}min`;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const SalaryCalc: React.FC<Props> = ({
  monthLabel = "2025年4月",
  goalYen = 30000,
  earnedYen = 0,
  workedMinutes = 0,
  estimatedYen = 0,
  onPrevMonth,
  onNextMonth,
  onBackToCurrent,
}) => {
  const progress = goalYen > 0 ? clamp01(earnedYen / goalYen) : 0;

  return (
    <section className="salary-calc" aria-labelledby="sc-month">
      <p id="sc-month" className="salary-calc__month">
        {monthLabel}
      </p>

      <div className="salary-calc__top">
        <div className="salary-calc__goal-wrapper" aria-live="polite">
          <span className="salary-calc__goal-label">月間目標 :</span>
          <span className="salary-calc__goal-value">{fmtYen(goalYen)}</span>
        </div>

        <div className="salary-calc__back-wrapper">
          <button
            type="button"
            className="salary-calc__back-square"
            onClick={onBackToCurrent}
            aria-label="今月に戻る"
            title="今月に戻る"
          >
            今月に <br />
            戻る
          </button>
        </div>
      </div>

      <p className="salary-calc__comment">目標達成目指して頑張ろう！！</p>

      <div className="salary-calc__navigation">
        <button
          type="button"
          className="salary-calc__nav-arrow"
          onClick={onPrevMonth}
          aria-label="前の月へ"
          title="前の月へ"
        >
          ＜
        </button>

        <div
          className="salary-calc__summary"
          style={{ ["--progress" as any]: progress } as React.CSSProperties}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="目標達成率"
        >
          <div className="salary-calc__ring-labels">
            <div className="salary-calc__summary-label">今日までの給料</div>
            <div className="salary-calc__summary-value">
              {fmtYen(earnedYen)}
            </div>
            <div className="salary-calc__summary-sub">
              達成率 {Math.round(progress * 100)}%
            </div>
          </div>
        </div>

        <button
          type="button"
          className="salary-calc__nav-arrow"
          onClick={onNextMonth}
          aria-label="次の月へ"
          title="次の月へ"
        >
          ＞
        </button>
      </div>

      <div className="salary-calc__details">
        <div className="salary-calc__detail">
          <div className="salary-calc__detail-label">勤務時間 :</div>
          <div className="salary-calc__detail-value">
            {fmtHm(workedMinutes)}
          </div>
        </div>
        <div className="salary-calc__detail">
          <div className="salary-calc__detail-label">給料見込み :</div>
          <div className="salary-calc__detail-value">
            {fmtYen(estimatedYen)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SalaryCalc;
