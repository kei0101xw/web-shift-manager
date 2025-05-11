import React from "react";
import { useParams } from "react-router-dom";
import "./EmployeeDetail.css";

const EmployeeDetail = () => {
  const { id } = useParams();

  const mockEmployee = {
    1: { name: "田中 太郎", department: "営業部", age: 30 },
    2: { name: "佐藤 花子", department: "経理部", age: 28 },
    3: { name: "鈴木 一郎", department: "開発部", age: 35 },
  };

  const employee = mockEmployee[id];

  if (!employee)
    return <p className="employee-detail-notfound">従業員が見つかりません</p>;

  return (
    <div className="employee-detail-container">
      <h1 className="employee-detail-name">{employee.name}</h1>
      <p className="employee-detail-info">部署: {employee.department}</p>
      <p className="employee-detail-info">年齢: {employee.age}歳</p>
      <button className="employee-edit-button" onClick={handleEditClick}>
        修正
      </button>
    </div>
  );
};

export default EmployeeDetail;
