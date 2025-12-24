import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./DeleteEmployee.css";

const DeleteEmployee = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [employee, setEmployee] = useState({
    employeeId: "",
    name: "",
    ...(location.state || {}), // ← 戻ってきたときの値を初期値にする
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // 入力中のエラーはクリア
  };

  const validate = () => {
    const newErrors = {};
    const idRegex = /^[0-9]+$/;
    const nameRegex = /^[^\s]+ [^\s]+$/;

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    navigate("/confirmemployee", { state: employee });
  };

  return (
    <div className="register-delete-container">
      <h1>従業員の削除</h1>

      <form onSubmit={handleSubmit} className="delete-form">
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

        <button type="submit">確認へ</button>
      </form>
    </div>
  );
};

export default DeleteEmployee;
