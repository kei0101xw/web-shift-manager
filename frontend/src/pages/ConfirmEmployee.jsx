// ConfirmEmployee.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./ConfirmEmployee.css";

const ConfirmEmployee = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return <p>データがありません。</p>;
  }

  const { employeeId, name, email, role, password } = state;

  // const handleBack = () => {
  //   navigate(-1); // 前のページへ戻る
  // };

  const handleConfirm = () => {
    console.log("送信データ:", state);
    alert("登録を確定しました！");
    // TODO: API送信処理をここに書く
  };

  const handleEdit = () => {
    navigate("/registeremployee", { state }); // フォームページに入力値付きで戻る
  };

  return (
    <>
      <Header />
      <div className="confirm-container">
        <h2>登録内容確認</h2>
        <p className="confirm-note">
          以下の内容で新たに従業員を登録します。
          <br />
          確認をお願いします。
        </p>
        <ul>
          <li>
            <strong>従業員番号：</strong>
            {employeeId}
          </li>
          <li>
            <strong>氏名：</strong>
            {name}
          </li>
          <li>
            <strong>メールアドレス：</strong>
            {email}
          </li>
          <li>
            <strong>雇用形態：</strong>
            {role}
          </li>
          <li>
            <strong>パスワード：</strong>
            {password.replace(/./g, "*")}
          </li>
        </ul>
        <button onClick={handleEdit}>修正する</button>
        <button onClick={handleConfirm}>この内容で登録</button>
      </div>
    </>
  );
};

export default ConfirmEmployee;
