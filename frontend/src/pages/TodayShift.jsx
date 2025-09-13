import React, { useState } from "react";
import "./TodayShift.css";

const TodayShift = () => {
  const [selected, setSelected] = useState("ホール");

  return (
    <>
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
      <div className="shift-selected">
        選択中: <b>{selected}</b>
      </div>
    </>
  );
};

export default TodayShift;
