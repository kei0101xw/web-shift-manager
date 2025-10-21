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
    employmentPeliod: today,
    workErea: "",
    isInternational: false,
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

    if (!employee.workErea) {
      newErrors.workErea = "担当を選択してください。";
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

          <label>
            <input
              type="checkbox"
              name="isInternational"
              checked={employee.isInternational}
              onChange={(e) =>
                setEmployee((prev) => ({
                  ...prev,
                  isInternational: e.target.checked,
                }))
              }
            />
            留学生です
          </label>

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

          <button type="submit">確認</button>
        </form>
      </div>
    </>
  );
};

export default RegisterEmployee;
