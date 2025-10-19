import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./Start.css";

const Start = () => {
  return (
    <div className="start-container">
      <h1>シジャン博多一番街店</h1>
      <img src={logo} alt="ロゴ画像" className="logo" />
      <div className="login-box">
        <h2 className="login-title">ログイン</h2>
        <Link to="/loginemployee" className="login-button employee">
          従業員の方はこちら ＞
        </Link>
        <Link to="/loginmanager" className="login-button admin">
          管理者の方はこちら ＞
        </Link>
      </div>
    </div>
  );
};

export default Start;
