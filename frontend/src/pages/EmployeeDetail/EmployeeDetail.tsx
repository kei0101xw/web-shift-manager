import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import "./EmployeeDetail.css";

type WorkArea = "キッチン" | "ホール" | "キッチン&ホール";
type Employee = {
  id: number;
  employeeId: string;
  name: string;
  status?: "active" | "inactive" | "suspended";
  role: "社員" | "パート" | "アルバイト";
  workArea: WorkArea | null;
  hourly_wage?: number | null;
  weekly_hour_cap?: number | null;
};

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateEmp = (location.state as any)?.employee as Employee | undefined;

  const [employee, setEmployee] = useState<Employee | null>(stateEmp ?? null);
  const [loading, setLoading] = useState(!stateEmp);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (employee ? employee.name : "従業員詳細"),
    [employee]
  );

  useEffect(() => {
    if (!id) return;

    const ac = new AbortController();
    (async () => {
      try {
        const data = (await api.get(`/employees/${id}`, {
          params: { include_deleted: false },
          signal: ac.signal as any,
        })) as Employee;
        setEmployee(data);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(
          "従業員情報の取得に失敗しました。時間をおいて再度お試しください。"
        );
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [id]);

  const handleEditClick = () => {
    if (!employee) return;
    navigate(`/employees/${employee.id}/edit`, { state: { employee } });
  };

  const handleBack = () => navigate("/employees");
  const handleDelete = () => {
    if (!employee) return;
    navigate(`/employees/${employee.id}/delete/confirm`, {
      state: { employee },
    });
  };

  if (loading) return <p className="employee-detail-loading">読み込み中...</p>;
  if (error) return <p className="employee-detail-error">{error}</p>;
  if (!employee) {
    return <p className="employee-detail-notfound">従業員が見つかりません</p>;
  }

  return (
    <div className="employee-detail-container">
      <h1 className="employee-detail-name">{title}</h1>

      <div className="employee-card">
        <div className="employee-detail-grid">
          <div className="row">
            <span className="label">従業員コード：</span>
            <span className="value">{employee.employeeId}</span>
          </div>
          <div className="row">
            <span className="label">雇用形態：</span>
            <span className="value">{employee.role}</span>
          </div>
          {employee.status && (
            <div className="row">
              <span className="label">ステータス：</span>
              <span className="value">{employee.status}</span>
            </div>
          )}
          <div className="row">
            <span className="label">担当：</span>
            <span className="value">{employee.workArea}</span>
          </div>
          {"hourly_wage" in employee && (
            <div className="row">
              <span className="label">時給：</span>
              <span className="value">{employee.hourly_wage ?? "-"}</span>
            </div>
          )}
          {"weekly_hour_cap" in employee && (
            <div className="row">
              <span className="label">週上限時間：</span>
              <span className="value">{employee.weekly_hour_cap ?? "-"}</span>
            </div>
          )}
        </div>
      </div>

      <div className="employee-detail-actions">
        <button className="button button--primary" onClick={handleEditClick}>
          修正
        </button>
        <button className="button button--danger" onClick={handleDelete}>
          削除
        </button>
      </div>
      <button className="employee-back-button" onClick={handleBack}>
        ← 戻る
      </button>
    </div>
  );
};

export default EmployeeDetail;
