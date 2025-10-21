// src/pages/DeleteEmployeeConfirm.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import "./DeleteEmployeeConfirm.css";

type WorkArea = "キッチン" | "ホール" | "キッチン&ホール";
type Employee = {
  id: number;
  employeeId: string; // サーバの employee_code をマッピング
  name: string;
  role: "社員" | "パート" | "アルバイト";
  workArea?: WorkArea | null;
};

const DeleteEmployeeConfirm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateEmp = (location.state as any)?.employee as Employee | undefined;

  const [employee, setEmployee] = useState<Employee | null>(stateEmp ?? null);
  const [loading, setLoading] = useState(!stateEmp);
  const [error, setError] = useState<string | null>(null);

  // 入力欄（確認用）
  const [codeInput, setCodeInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [ack, setAck] = useState(false); // 取り消し不可を理解したチェック

  const normalize = (s: string) =>
    s
      .replace(/\u3000/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const disabled =
    !employee ||
    !ack ||
    normalize(codeInput) !== employee.employeeId ||
    normalize(nameInput) !== employee.name;

  useEffect(() => {
    if (stateEmp || !id) return;
    const ac = new AbortController();
    (async () => {
      try {
        const data = await api.get(`/employees/${id}`, {
          params: { include_deleted: false },
          signal: ac.signal as any,
        });
        setEmployee(data as Employee);
      } catch (e) {
        setError("従業員情報の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [id, stateEmp]);

  // const disabled =
  //   !employee ||
  //   !ack ||
  //   codeInput.trim() !== (employee?.employeeId ?? "") ||
  //   nameInput.trim() !== (employee?.name ?? "");

  const handleDelete = async () => {
    if (!employee) return;
    try {
      // 最終実行：ソフトデリート（サーバ側でも一致確認を行う）
      await api.del(`/employees/${employee.id}`, {
        body: {
          confirm_employee_code: normalize(codeInput),
          confirm_name: normalize(nameInput),
          hard: false,
        },
      });
      // 成功UX：一覧へ戻し、トースト or メッセージ
      navigate("/employees", {
        replace: true,
        state: { toast: { type: "info", message: "従業員を削除しました。" } },
      });
    } catch (e: any) {
      if (e?.data?.error === "has_future_assignments") {
        alert(
          "未消化のシフト割当があるため削除できません。先に割当を解除してください。"
        );
      } else if (e?.data?.error === "mismatch") {
        alert("確認用の氏名または従業員コードが一致しません。");
      } else {
        alert("削除に失敗しました。時間をおいて再度お試しください。");
      }
    }
  };

  const handleCancel = () => {
    if (employee) navigate(`/employees/${employee.id}`);
    else navigate("/employees");
  };

  if (loading)
    return <div className="employee-detail-loading">読み込み中...</div>;
  if (error) return <div className="employee-detail-error">{error}</div>;
  if (!employee)
    return (
      <div className="employee-detail-notfound">従業員が見つかりません</div>
    );

  return (
    <div className="employee-delete-container">
      <h1 className="employee-delete-title">削除の確認</h1>
      <p className="employee-delete-message">
        次の従業員を削除します。取り消しはできません。
      </p>

      <div className="employee-card">
        <div className="row">
          <span className="label">氏名</span>
          <span className="value">{employee.name}</span>
        </div>
        <div className="row">
          <span className="label">従業員コード</span>
          <span className="value">{employee.employeeId}</span>
        </div>
        {employee.workArea && (
          <div className="row">
            <span className="label">担当</span>
            <span className="value">{employee.workArea}</span>
          </div>
        )}
      </div>

      <div className="employee-delete-form">
        <label>確認のため、氏名を入力してください</label>
        <input
          type="text"
          autoComplete="off"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder={employee.name}
        />

        <label>確認のため、従業員コードを入力してください</label>
        <input
          type="text" // ← number にしない！先頭0や "E-" を保持
          autoComplete="off"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          placeholder={employee.employeeId}
        />

        <label className="checkbox">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
          />
          この操作が取り消せない可能性があることを理解しました
        </label>
      </div>

      <div className="employee-detail-actions">
        <button className="button" onClick={handleCancel}>
          キャンセル
        </button>
        <button
          className="button button--danger"
          disabled={disabled}
          onClick={handleDelete}
          title={disabled ? "氏名・コードが一致し、同意チェックが必要です" : ""}
        >
          削除する
        </button>
      </div>
    </div>
  );
};

export default DeleteEmployeeConfirm;
