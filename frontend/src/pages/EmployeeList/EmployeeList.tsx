import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import "./EmployeeList.css";

type Employee = {
  id: number; // DBの主キー（URLはこれを使うのが安定）
  employeeId: string; // 画面表示用の従業員番号（"00123" など先頭0を保持）
  name: string;
  workArea?: string; // workErea → workArea に統一（サーバ側も合わせる）
  role: "社員" | "パート" | "アルバイト";
  // email や内部情報は一覧では出さない（最小表示）
};

const EmployeeList = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const list = (await api.get("/employees", {
          params: { include_deleted: false, order: "name_asc", limit: 100 },
          signal: ac.signal as any,
        })) as Employee[];

        console.log("employees payload:", list);
        setEmployees(list);
      } catch (e: any) {
        console.error("EmployeeList fetch error:", e);
        if (e?.name === "AbortError") {
          return;
        }
        setError(
          "従業員一覧の取得に失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  if (loading) {
    return <div className="employee-list-loading">読み込み中...</div>;
  }
  if (error) {
    return <div className="employee-list-error">{error}</div>;
  }
  if (employees.length === 0) {
    return (
      <div className="employee-list-empty">従業員が登録されていません。</div>
    );
  }

  return (
    <div className="employee-list-container">
      <h1 className="employee-list-title">従業員一覧</h1>
      {/* <pre>{JSON.stringify(employees, null, 2)}</pre> */}
      <div className="employee-card-grid">
        {employees.map((emp) => (
          <button
            key={emp.id}
            className="employee-card"
            onClick={() =>
              navigate(`/employees/${emp.id}`, {
                state: { employee: emp }, // 詳細で即表示用（直リンク時は詳細側で再fetch）
              })
            }
          >
            <h2 className="employee-name">{emp.name}</h2>
            <div className="employee-meta">
              <span className="badge">{emp.role}</span>
              <span>：</span>
              {emp.workArea && <span className="pill">{emp.workArea}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmployeeList;
