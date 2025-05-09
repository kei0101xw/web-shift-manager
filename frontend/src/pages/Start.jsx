import React from "react";
import logo from "../assets/logo.png"; // 相対パスでインポート
import "./Start.css";

const Start = () => {
  return (
    <div className="start-container">
      <h1>シジャン博多一番街店</h1>
      <img src={logo} alt="ロゴ画像" className="logo" />
      <div class="login-box">
        <h2 class="login-title">ログイン</h2>
        <button class="login-button employee">従業員の方はこちら</button>
        <button class="login-button admin">管理者の方はこちら</button>
      </div>
    </div>
  );
};

export default Start;
