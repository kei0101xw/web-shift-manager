import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EmployeeEdit.css";

const EmployeeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const mockEmployee = {
    1: { name: "田中 太郎", department: "営業部", age: 30 },
    2: { name: "佐藤 花子", department: "経理部", age: 28 },
    3: { name: "鈴木 一郎", department: "開発部", age: 35 },
  };

  const employee = mockEmployee[Number(id)];

  const [formData, setFormData] = useState(
    employee || { name: "", department: "", age: "" }
  );

  if (!employee) {
    return <p className="employee-edit-notfound">従業員が見つかりません</p>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    console.log("保存する従業員情報:", formData);
    // APIで保存する処理をここに追加予定
    navigate(`/employees/${id}`);
  };

  const handleDelete = () => {
    console.log(`従業員ID ${id} を削除しました`);
    // APIで削除処理をここに追加予定
    navigate(`/employees/${id}/delete-confirm`);
  };

  return (
    <div className="employee-edit-container">
      <h1 className="employee-edit-title">従業員情報の修正</h1>
      <form className="employee-edit-form" onSubmit={(e) => e.preventDefault()}>
        <label className="employee-edit-label">
          名前:
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="employee-edit-input"
          />
        </label>
        <label className="employee-edit-label">
          部署:
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="employee-edit-input"
          />
        </label>
        <label className="employee-edit-label">
          年齢:
          <input
            type="number"
            name="age"
            value={formData.age}
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
