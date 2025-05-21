import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./RegisterEmployee.css";

const RegisterEmployee = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().slice(0, 10);

  const [employee, setEmployee] = useState({
    employeeId: "",
    name: "",
    email: "",
    employmentPeliod: today,
    workErea: "",
    workingHours: "",
    role: "",
    password: "",
    ...(location.state || {}), // ← 戻ってきたときの値を初期値にする
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // 入力中のエラーはクリア
  };

  const validate = () => {
    const newErrors = {};
    const idRegex = /^[0-9]+$/;
    const nameRegex = /^[^\s]+ [^\s]+$/; // 半角スペースが1つ含まれる氏名
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!employee.employeeId) {
      newErrors.employeeId = "従業員番号を入力してください。";
    } else if (!idRegex.test(employee.employeeId)) {
      newErrors.employeeId = "従業員番号は数字のみで入力してください。";
    }

    if (!employee.name) {
      newErrors.name = "氏名を入力してください。";
    } else if (!nameRegex.test(employee.name)) {
      newErrors.name =
        "氏名は半角スペースで姓と名を区切ってください。（例: 山田 太郎）";
    }

    if (!employee.email) {
      newErrors.email = "メールアドレスを入力してください。";
    } else if (!emailRegex.test(employee.email)) {
      newErrors.email = "正しいメールアドレス形式で入力してください。";
    }

    if (!employee.workErea) {
      newErrors.workErea = "担当を選択してください。";
    }

    if (!employee.workingHours) {
      newErrors.workingHours = "勤務期間を入力してください。";
    }

    if (!employee.role) {
      newErrors.role = "雇用形態を選択してください。";
    }

    if (!employee.password) {
      newErrors.password = "パスワードを入力してください。";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(false);

    if (!validate()) return;

    navigate("/confirmemployee", { state: employee });
  };

  return (
    <>
      <div className="register-container">
        <h1>従業員登録</h1>
        <form onSubmit={handleSubmit} className="register-form">
          <label>従業員番号</label>
          <input
            type="number"
            name="employeeId"
            value={employee.employeeId}
            onChange={handleChange}
            placeholder="例: 12345"
          />
          {errors.employeeId && (
            <p className="error-message">{errors.employeeId}</p>
          )}

          <label>氏名</label>
          <input
            type="text"
            name="name"
            value={employee.name}
            onChange={handleChange}
            placeholder="例: 山田 太郎"
          />
          {errors.name && <p className="error-message">{errors.name}</p>}

          <label>メールアドレス</label>
          <input
            type="email"
            name="email"
            value={employee.email}
            onChange={handleChange}
            placeholder="例: example@example.com"
          />
          {errors.email && <p className="error-message">{errors.email}</p>}

          <label>担当</label>
          <select
            name="workErea"
            value={employee.workErea}
            onChange={handleChange}
          >
            <option value="">選択してください</option>
            <option value="キッチン">キッチン</option>
            <option value="ホール">ホール</option>
            <option value="キッチン&ホール">キッチン&ホール</option>
          </select>
          {errors.workErea && (
            <p className="error-message">{errors.workErea}</p>
          )}

          <label>最大可能勤務時間 [ h / 週 ]</label>
          <input
            type="number"
            name="workingHours"
            value={employee.workingHours}
            onChange={handleChange}
            placeholder="例: 28"
          />
          {errors.workingHours && (
            <p className="error-message">{errors.workingHours}</p>
          )}

          <label>雇用形態</label>
          <select name="role" value={employee.role} onChange={handleChange}>
            <option value="">選択してください</option>
            <option value="社員">社員</option>
            <option value="パート">パート</option>
            <option value="アルバイト">アルバイト</option>
          </select>
          {errors.role && <p className="error-message">{errors.role}</p>}

          <label>パスワード</label>
          <input
            type="password"
            name="password"
            value={employee.password}
            onChange={handleChange}
            placeholder="パスワードを入力"
          />
          {errors.password && (
            <p className="error-message">{errors.password}</p>
          )}

          <button type="submit">登録</button>
        </form>
        {submitted && <p className="success-message">登録が完了しました！</p>}
      </div>
    </>
  );
};

export default RegisterEmployee;
