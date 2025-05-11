import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployeeList.css";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const mockEmployees = [
      {
        employeeId: 123456, //データベース8つで構成
        name: "田中 太郎",
        email: "ttt@icloud.com",
        employmentPeliod: "13ヶ月",
        workErea: "キッチン",
        workingHours: 30,
        role: "アルバイト",
        pass: "qwer",
      },
      {
        name: "田中 進次郎",
        email: "ppap@icloud.com",
        employeeId: "133336",
        employmentPeliod: "22ヶ月",
        workErea: "キッチン",
        workingHours: 150,
        role: "社員",
        pass: "erty",
      },
      {
        name: "鈴木 一郎",
        email: "pasd@icloud.com",
        employeeId: "333336",
        employmentPeliod: "33ヶ月",
        workErea: "ホール",
        workingHours: 10,
        role: "パート",
        pass: "asdd",
      },
    ];
    setEmployees(mockEmployees);
  }, []);

  return (
    <div className="employee-list-container">
      <h1 className="employee-list-title">従業員一覧</h1>
      <div className="employee-card-grid">
        {employees.map((employee) => (
          <div
            key={employee.employeeId}
            className="employee-card"
            onClick={() => navigate(`/employees/${employee.employeeId}`)}
          >
            <h2 className="employee-name">{employee.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeList;
