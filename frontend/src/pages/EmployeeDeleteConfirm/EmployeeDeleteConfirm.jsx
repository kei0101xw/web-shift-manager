import React, { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./EmployeeDeleteConfirm.css";

const EmployeeDeleteConfirm = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { employee } = location.state || {};
  const [deleted, setDeleted] = useState(false); // ← 削除済みフラグ

  if (!employee) {
    return <p className="employee-delete-notfound">従業員が見つかりません</p>;
  }

  const handleCancel = () => {
    navigate(`/employees/${employeeId}/edit`, { state: { employee } });
  };

  const handleConfirmDelete = () => {
    console.log(`従業員番号 ${employeeId} を最終的に削除しました`);
    setDeleted(true);
  };

  const handleOk = () => {
    navigate("/home");
  };

  if (!employee) {
    return <p className="employee-delete-notfound">従業員が見つかりません</p>;
  }

  return (
    <>
      <div className="employee-delete-container">
        {!deleted ? (
          <>
            <h1 className="employee-delete-title">削除の確認</h1>
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
    </>
  );
};

export default EmployeeDeleteConfirm;
