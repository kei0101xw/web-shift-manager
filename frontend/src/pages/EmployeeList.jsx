import React, { useEffect, useState } from "react";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);

  // 仮のAPIまたはデータ
  useEffect(() => {
    // ここは実際にはfetchなどでAPIから取得する想定
    const mockEmployees = [
      { id: 1, name: "田中 太郎" },
      { id: 2, name: "佐藤 花子" },
      { id: 3, name: "鈴木 一郎" },
    ];
    setEmployees(mockEmployees);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">従業員一覧</h1>
      <ul className="space-y-2">
        {employees.map((employee) => (
          <li key={employee.id} className="border p-2 rounded shadow">
            {employee.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmployeeList;
