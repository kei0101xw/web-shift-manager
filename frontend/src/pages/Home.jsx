import React from "react";
import "./Home.css";
import Header from "../components/Header";

const Home = () => {
  return (
    <>
      <Header />
      <div className="home-container">
        <div>Welcome back, Tomohiro Furuta</div>
        <div className="all-button-group">
          <div className="shift-button-group">
            <button className="shift-button">全体のシフト</button>
            <button className="shift-button">Myシフト</button>
            <button className="shift-button">本日のシフト</button>
          </div>
          <hr></hr>
          <div className="shift-apply-button-group">
            <button className="shift-apply--button">シフト申請・修正</button>
          </div>
          <hr></hr>
          <div className="salary-calc-button-group">
            <button className="salary-calc-button">給料計算</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
