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

  const {
    employeeId,
    name,
    email,
    employmentPeliod,
    workErea,
    workingHours,
    role,
    password,
  } = state;

  const handleConfirm = () => {
    console.log("送信データ:", state);
    alert("登録を確定しました！");
    // TODO: API送信処理をここに書く
    navigate("/home");
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
          入力内容を確認して下さい。
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
            <strong>出勤開始日：</strong>
            {employmentPeliod}
          </li>
          <li>
            <strong>担当：</strong>
            {workErea}
          </li>
          <li>
            <strong>最大可能勤務時間：</strong>
            {workingHours}
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
