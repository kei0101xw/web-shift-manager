import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import calendar from "../assets/calendar.png";
import human from "../assets/human.png";
import people from "../assets/people.png";
import money from "../assets/money.png";
import paper from "../assets/paper.png";
import eraser from "../assets/eraser.png";

const Home = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="home-container">
        <div>Welcome back, Tomohiro Furuta</div>
        <div className="all-button-group">
          <div className="button-title shift">シフトの確認</div>
          <div className="shift-button-group">
            <button
              className="shift-button all"
              onClick={() => navigate("/allshift")}
            >
              <div className="shift-button-sentence">全体のシフト</div>
              <img src={people} alt="ロゴ画像" className="people-logo" />
            </button>
            <button
              className="shift-button my"
              onClick={() => navigate("/myshift")}
            >
              <div className="shift-button-sentence">Myシフト</div>
              <img src={human} alt="ロゴ画像" className="human-logo" />
            </button>
            <button
              className="shift-button today"
              onClick={() => navigate("/todayshift")}
            >
              <div className="shift-button-sentence">本日のシフト</div>
              <img src={calendar} alt="ロゴ画像" className="calendar-logo" />
            </button>
          </div>
          <hr></hr>
          <div className="button-title submit">シフトの提出・修正</div>
          <div className="shift-apply-modify-group">
            <button
              className="shift-apply-button"
              onClick={() => navigate("/shiftapply")}
            >
              <div className="shift-apply-button-sentence">シフト申請</div>
              <img src={paper} alt="ロゴ画像" className="paper-logo" />
            </button>
            <button
              className="shift-modify-button"
              onClick={() => navigate("/shiftedit")}
            >
              <div className="shift-modify-button-sentence">シフト修正</div>
              <img src={eraser} alt="ロゴ画像" className="eraser-logo" />
            </button>
          </div>
          <hr></hr>
          <div className="button-title shift">給料</div>
          <div className="salary-calc-button-group">
            <button
              className="salary-calc-button"
              onClick={() => navigate("/salarycalc")}
            >
              <div className="salary-calc-sentence">給料計算</div>
              <img src={money} alt="ロゴ画像" className="money-logo" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
