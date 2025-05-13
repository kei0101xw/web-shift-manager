import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./EmployeeEdit.css";

const EmployeeEdit = () => {
  const location = useLocation();
  const { employee } = location.state || {};
  const navigate = useNavigate();

  const [formData, setFormData] = useState(
    employee || {
      name: "",
      email: "",
      employeeId: "",
      employmentPeliod: "",
      workErea: "",
      workingHours: 0,
      role: "",
      pass: "",
    }
  );

  if (!employee) {
    return <p className="employee-edit-notfound">従業員が見つかりません</p>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "workingHours" ? Number(value) : value,
    }));
  };

  const handleSave = () => {
    console.log("保存する従業員情報:", formData);
    // APIで保存する処理をここに追加予定
    navigate(`/employees/${employee.employeeId}`, {
      state: { employee: formData },
    });
  };

  const handleDelete = () => {
    console.log(`従業員ID ${employee.employeeId} を削除しました`);
    // APIで削除処理をここに追加予定
    navigate(`/employees/${employee.employeeId}/delete-confirm`, {
      state: { employee: formData },
    });
  };

  return (
    <div className="employee-edit-container">
      <h1 className="employee-edit-title">従業員情報の修正</h1>
      <form className="employee-edit-form" onSubmit={(e) => e.preventDefault()}>
        <label className="employee-edit-label">
          氏名:
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="employee-edit-input"
            disabled
          />
        </label>
        <label className="employee-edit-label">
          メールアドレス:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="employee-edit-input"
          />
        </label>
        <label className="employee-edit-label">
          従業員番号:
          <input
            type="text"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            className="employee-edit-input"
            disabled // IDは変更不可にしておくと安全
          />
        </label>
        <label className="employee-edit-label">
          勤務期間:
          <input
            type="text"
            name="employmentPeliod"
            value={formData.employmentPeliod}
            onChange={handleChange}
            className="employee-edit-input"
            disabled
          />
        </label>
        <label className="employee-edit-label">
          担当:
          <input
            type="text"
            name="workErea"
            value={formData.workErea}
            onChange={handleChange}
            className="employee-edit-input"
          />
        </label>
        <label className="employee-edit-label">
          勤務時間（週）:
          <input
            type="number"
            name="workingHours"
            value={formData.workingHours}
            onChange={handleChange}
            className="employee-edit-input"
          />
        </label>
        <label className="employee-edit-label">
          役職:
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="employee-edit-input"
          />
        </label>

        <div className="employee-edit-buttons">
          <button
            type="button"
            onClick={handleSave}
            className="employee-save-button"
          >
            保存
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="employee-delete-button"
          >
            削除
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeEdit;
