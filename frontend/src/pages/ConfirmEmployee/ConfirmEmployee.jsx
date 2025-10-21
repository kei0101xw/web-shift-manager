import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ConfirmEmployee.css";
import { api } from "../../lib/api";

const ConfirmEmployee = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return <p>データがありません。</p>;
  }

  const {
    employeeId,
    name,
    employmentPeliod,
    workErea,
    isInternational,
    role,
    password,
  } = state;

  const handleConfirm = async () => {
    try {
      // 1) 画面 → サーバ形式にマッピング
      const employment_typeMap = {
        社員: "full_time",
        パート: "part_time",
        アルバイト: "baito",
      };
      const employment_type = employment_typeMap[role];

      const roles_by_code =
        workErea === "キッチン"
          ? ["kitchen"]
          : workErea === "ホール"
          ? ["hall"]
          : workErea === "キッチン&ホール"
          ? ["kitchen", "hall"]
          : [];

      // 2) POST /employees
      const createRes = await api.post("/employees", {
        name,
        password,
        employment_type, // "full_time" | "part_time" | "baito"
        status: "active",
        is_international_student: Boolean(isInternational), // 週上限は後でPATCHするので false でOK
        roles_by_code, // ["kitchen", "hall"] など
      });
      const created = createRes.data ?? createRes; // your api ラッパ次第
      const newId = created.id;

      alert("登録が完了しました。");
      navigate("/home");
    } catch (e) {
      console.error(e);
      alert("登録に失敗しました。入力内容をご確認ください。");
    }
  };

  const handleEdit = () => {
    navigate("/registeremployee", { state }); // フォームページに入力値付きで戻る
  };

  return (
    <>
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
            <strong>出勤開始日：</strong>
            {employmentPeliod}
          </li>
          <li>
            <strong>担当：</strong>
            {workErea}
          </li>
          <li>
            <strong>留学生：</strong>
            {isInternational ? "はい（週28時間まで）" : "いいえ"}
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
