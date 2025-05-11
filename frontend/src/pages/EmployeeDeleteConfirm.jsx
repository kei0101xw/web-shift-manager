import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EmployeeDeleteConfirm.css";

const EmployeeDeleteConfirm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleted, setDeleted] = useState(false); // ← 削除済みフラグ

  const mockEmployee = {
    1: { name: "田中 太郎", department: "営業部", age: 30 },
    2: { name: "佐藤 花子", department: "経理部", age: 28 },
    3: { name: "鈴木 一郎", department: "開発部", age: 35 },
  };

  const employee = mockEmployee[Number(id)];

  const handleCancel = () => {
    navigate(`/employees/${id}/edit`);
  };

  const handleConfirmDelete = () => {
    console.log(`従業員ID ${id} を最終的に削除しました`);
    setDeleted(true);
  };

  const handleOk = () => {
    navigate("/");
  };

  if (!employee) {
    return <p className="employee-delete-notfound">従業員が見つかりません</p>;
  }

  return (
    <div className="employee-delete-container">
      {!deleted ? (
        <>
          <h2 className="employee-delete-title">削除の確認</h2>
          <p className="employee-delete-message">
            「{employee.name}」さんを本当に削除しますか？
          </p>
          <div className="employee-delete-buttons">
            <button
              onClick={handleConfirmDelete}
              className="employee-confirm-delete-button"
            >
              削除する
            </button>
            <button onClick={handleCancel} className="employee-cancel-button">
              キャンセル
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="employee-delete-title">削除しました</h2>
          <button onClick={handleOk} className="employee-ok-button">
            OK
          </button>
        </>
      )}
    </div>
  );
};

export default EmployeeDeleteConfirm;
