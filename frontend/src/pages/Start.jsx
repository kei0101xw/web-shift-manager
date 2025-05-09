import React from "react";
import logo from "./assets/logo.png"; // 相対パスでインポート

const Start = () => {
  return (
    <div>
      <h1>シジャン博多一番街店</h1>
      <img src={logo} alt="ロゴ画像" className="logo" />
      <h2>ログイン</h2>
      <button>従業員の方はこちら</button>
      <button>管理者の方はこちら</button>
    </div>
  );
};

export default Start;
