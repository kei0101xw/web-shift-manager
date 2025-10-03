import React from "react";
import "./SalaryCalc.css";

const SalaryCalc = () => {
  return (
    <div className="salary-calc">
      <p className="salary-calc__month">2025年4月</p>
      <div className="salary-calc__top">
        <div className="salary-calc__goal-wrapper">
          <div className="salary-calc__goal">月間目標 : </div>
          <div className="salary-calc__goal-value">¥30,000</div>
        </div>
        <div className="salary-calc__back-wrapper">
          <button className="salary-calc__back-square"></button>
          <div className="salary-calc__back-text">今月に戻る</div>
        </div>
      </div>
      <div className="salary-calc__comment">目標達成目指して頑張ろう！！</div>

      <div className="salary-calc__navigation">
        <button className="salary-calc__nav-arrow">＜</button>
        <div className="salary-calc__summary" style={{ "--progress": 0 }}>
          <div className="salary-calc__summary-label">今日までの給料</div>
          <div className="salary-calc__summary-value">¥0</div>
        </div>
        <button className="salary-calc__nav-arrow">＞</button>
      </div>
      <div className="salary-calc__details">
        <div className="salary-calc__detail">
          <div className="salary-calc__detail-label">勤務時間 : </div>
          <div className="salary-calc__detail-value">0h00min</div>
        </div>
        <div className="salary-calc__detail">
          <div className="salary-calc__detail-label">給料見込み : </div>
          <div className="salary-calc__detail-value">¥0</div>
        </div>
      </div>
    </div>
  );
};

export default SalaryCalc;
