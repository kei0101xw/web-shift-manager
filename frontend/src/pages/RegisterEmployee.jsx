import React, { useState } from "react";
import "./RegisterEmployee.css";
import Header from "../components/Header";

const RegisterEmployee = () => {
  const [employee, setEmployee] = useState({
    employeeId: "",
    name: "",
    email: "",
    role: "", // 雇用形態（アルバイト・社員・パート）
    password: "",
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

    console.log("登録データ:", employee);
    setSubmitted(true);

    // TODO: ここでAPI送信処理などを行う
  };

  return (
    <>
      <Header />
      <div className="register-container">
        <h2>従業員登録</h2>
        <form onSubmit={handleSubmit} className="register-form">
          <label>従業員番号</label>
          <input
            type="text"
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
