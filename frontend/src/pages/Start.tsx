import React from "react";
import logo from "../assets/logo.png";
import "./Start.css";

const Start = (): JSX.Element => {
  return (
    <div className="start-container">
      <h1>シジャン博多一番街店</h1>
      <img src={logo} alt="ロゴ画像" className="logo" />
      <div className="login-box">
        <h2 className="login-title">ログイン</h2>
        <button className="login-button employee">従業員の方はこちら</button>
        <button className="login-button admin">管理者の方はこちら</button>
      </div>
    </div>
  );
};

export default Start;
