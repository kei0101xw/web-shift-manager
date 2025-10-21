import React from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerHome.css";
import calendar from "../../assets/calendar.png";
import human from "../../assets/human.png";
import people from "../../assets/people.png";
import money from "../../assets/money.png";
import paper from "../../assets/paper.png";
import eraser from "../../assets/eraser.png";
import { useAuth } from "../../auth/AuthContext";

const ManagerHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <>
      <div className="home-container">
        <div className="home-greeting">Welcome back, {user?.name ?? ""}</div>
        <div className="all-button-group">
          <div className="button-title shift">シフトの確認</div>
          <div className="shift-button-group">
            <button
              className="shift-button all"
              onClick={() => navigate("/allshift")}
            >
              <div className="shift-button-sentence">
                全体の
                <br />
                シフト
              </div>
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
              <div className="shift-button-sentence">
                本日の
                <br />
                シフト
              </div>
              <img src={calendar} alt="ロゴ画像" className="calendar-logo" />
            </button>
          </div>
          <hr></hr>
          <div className="button-title submit">シフトの作成・管理</div>
          <div className="shift-create-manage-group">
            <button
              className="shift-create-button"
              onClick={() => navigate("/shiftplanner")}
            >
              <div className="shift-create-button-sentence">シフト作成</div>
              <img src={paper} alt="ロゴ画像" className="paper-logo" />
            </button>
            <button
              className="shift-manage-button"
              onClick={() => navigate("/shiftmanage")}
            >
              <div className="shift-manage-button-sentence">シフト管理</div>
              <img src={eraser} alt="ロゴ画像" className="eraser-logo" />
            </button>
          </div>
          <hr></hr>
          <div className="button-title employee">従業員の管理</div>
          <div className="register-button-group">
            <button
              className="employee-register-button"
              onClick={() => navigate("/registeremployee")}
            >
              <div className="employee-register-sentence">従業員の登録</div>
              <img src={money} alt="ロゴ画像" className="money-logo" />
            </button>
            <button
              className="employee-list-button"
              onClick={() => navigate("/employees")}
            >
              <div className="employee-delete-sentence">従業員一覧</div>
              <img src={money} alt="ロゴ画像" className="money-logo" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagerHome;
