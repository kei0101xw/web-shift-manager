import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployeeList.css";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const mockEmployees = [
      { id: 1, name: "田中 太郎" },
      { id: 2, name: "佐藤 花子" },
      { id: 3, name: "鈴木 一郎" },
      { id: 4, name: "田中 太郎" },
      { id: 5, name: "佐藤 花子" },
      { id: 6, name: "鈴木 一郎" },
      { id: 7, name: "田中 太郎" },
      { id: 8, name: "佐藤 花子" },
      { id: 9, name: "鈴木 一郎" },
      { id: 10, name: "田中 太郎" },
      { id: 11, name: "佐藤 花子" },
      { id: 12, name: "鈴木 一郎" },
    ];
    setEmployees(mockEmployees);
  }, []);

  return (
    <div className="employee-list-container">
      <h1 className="employee-list-title">従業員一覧</h1>
      <div className="employee-card-grid">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="employee-card"
            onClick={() => navigate(`/employees/${employee.id}`)}
          >
            <h2 className="employee-name">{employee.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeList;
