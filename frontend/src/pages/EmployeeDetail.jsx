import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./EmployeeDetail.css";
import Header from "../components/Header";

const EmployeeDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { employee } = location.state || {};

  if (!employee) {
    return <p className="employee-detail-notfound">従業員が見つかりません</p>;
  }

  const handleEditClick = () => {
    navigate(`/employees/${employee.employeeId}/edit`, {
      state: { employee },
    });
  };

  return (
    <>
      <Header />
      <div className="employee-detail-container">
        <h1 className="employee-detail-name">{employee.name}</h1>
        <p className="employee-detail-info">メール: {employee.email}</p>
        <p className="employee-detail-info">従業員ID: {employee.employeeId}</p>
        <p className="employee-detail-info">
          勤務期間: {employee.employmentPeliod}
        </p>
        <p className="employee-detail-info">担当: {employee.workErea}</p>
        <p className="employee-detail-info">
          勤務時間（週）: {employee.workingHours} 時間
        </p>
        <p className="employee-detail-info">役職: {employee.role}</p>
        <p className="employee-detail-info">パスワード: {employee.pass}</p>
        <button className="employee-edit-button" onClick={handleEditClick}>
          修正
        </button>
      </div>
    </>
  );
};

export default EmployeeDetail;
