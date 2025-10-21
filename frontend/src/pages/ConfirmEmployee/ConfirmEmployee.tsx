// src/pages/ConfirmEmployee.tsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ConfirmEmployee.css";
import { api } from "../../lib/api";

// 画面値と合わせる（RegisterEmployee.tsx で定義した型と一致させる）
type WorkArea = "キッチン" | "ホール" | "キッチン&ホール";
type RoleJa = "社員" | "パート" | "アルバイト";

type FormValues = {
  employeeId: string;
  name: string;
  employmentPeriod: string;        // ← Register側は employmentPeriod（P）に直していた想定
  workArea: WorkArea;
  isInternational: boolean;
  role: RoleJa;
  password: string;
};

// 役割コード変換（英語キー）
const toEmploymentType = (role: RoleJa) =>
  role === "社員" ? "full_time" : role === "パート" ? "part_time" : "baito";

// 任意：roles_by_code を付与したい場合の例
const toRoleCodes = (workArea: WorkArea): string[] => {
  if (workArea === "キッチン") return ["kitchen"];
  if (workArea === "ホール") return ["hall"];
  return ["kitchen", "hall"]; // キッチン&ホール
};

const ConfirmEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [submitting, setSubmitting] = useState(false);

  // state が無い（直アクセス等）のとき
  if (!state) {
    return <p>データがありません。</p>;
  }

  // フォームから渡された値を型付け
  const {
    employeeId,
    name,
    employmentPeriod,   // ← ここは Register 側と合わせる
    workArea,           // ← workErea ではなく workArea
    isInternational,
    role,
    password,
  } = state as FormValues;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);

      // 1) 画面値 → サーバ形式にマッピング
      const employment_type = toEmploymentType(role); // "full_time" | "part_time" | "baito"
      const roles_by_code = toRoleCodes(workArea);    // 例: ["kitchen"], ["hall"], ["kitchen","hall"]

      // NOTE:
      // - バックエンドは employee_code を内部で自動採番しています（E-XXXXXX）
      // - もしフォームの employeeId（ユーザー入力）を保存したいなら、
      //   サーバにカラムを用意するか、別フィールド（例: external_employee_id）で受けるように変更が必要です。

      // 2) POST /employees
      // あなたの api ラッパは res.json() をそのまま返す実装なので、
      // createRes.data ではなく createRes をそのまま使う
      const created = await api.post("/employees", {
        name,
        password,
        employment_type,
        status: "active",
        is_international_student: Boolean(isInternational),
        work_area: workArea,        // ← サーバは snake_case
        roles_by_code,              // ← 必要な場合のみ
        // employeeId は現状サーバ側のスキーマに無いので送っても無視されます
      });

      // created には { id, employee_code, name, ... } 等が返る想定
      alert("登録が完了しました。");

      // 詳細ページに飛ぶのが体験良い（id を使う）
      const newId = created.id as number | undefined;
      if (newId) {
        navigate(`/employees/${newId}`, { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (e) {
      console.error(e);
      alert("登録に失敗しました。入力内容をご確認ください。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    // 入力値を保持したまま戻る
    navigate("/registeremployee", { state });
  };

  return (
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
          {employmentPeriod}
        </li>
        <li>
          <strong>担当：</strong>
          {workArea}
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

      <div className="confirm-actions">
        <button onClick={handleEdit} disabled={submitting}>修正する</button>
        <button onClick={handleConfirm} disabled={submitting}>
          {submitting ? "送信中..." : "この内容で登録"}
        </button>
      </div>
    </div>
  );
};

export default ConfirmEmployee;
