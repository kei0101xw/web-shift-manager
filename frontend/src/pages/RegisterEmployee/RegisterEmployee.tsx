import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./RegisterEmployee.css";

type WorkArea = "キッチン" | "ホール" | "キッチン&ホール";
type RoleJa = "社員" | "パート" | "アルバイト";

type FormValues = {
  employeeId: string;
  name: string;
  employmentPeriod: string;
  workArea: WorkArea | "";
  isInternational: boolean;
  role: RoleJa | "";
  password: string;
};

// エラー型（必要なキーだけ）
type FormErrors = Partial<
  Record<"employeeId" | "name" | "workArea" | "role" | "password", string>
>;

const RegisterEmployee: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().slice(0, 10);

  const [employee, setEmployee] = useState<FormValues>({
    employeeId: "",
    name: "",
    employmentPeriod: today,
    workArea: "",
    isInternational: false,
    role: "",
    password: "",
    ...(location.state as Partial<FormValues> | undefined),
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    // 前後スペース削除（氏名は中間スペースは残す）
    if (name !== "name") value = value.trim();

    // 従業員番号は全角→半角、非数字除去
    if (name === "employeeId") {
      value = value.replace(/[！-～]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0)
      );
      value = value.replace(/\D/g, ""); // 数字以外を削除
    }

    setEmployee((prev) => ({ ...prev, [name]: value } as FormValues));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const normalizedName = employee.name
    .replace(/\s+/g, " ")
    .replace(/\u3000/g, " ");

  const validate = () => {
    const newErrors: FormErrors = {};
    const idRegex = /^[0-9]+$/;
    const nameRegex = /^[^\s]+ [^\s]+$/; // 姓と名の間に半角スペース1つ

    if (!employee.employeeId) {
      newErrors.employeeId = "従業員番号を入力してください。";
    } else if (!idRegex.test(employee.employeeId)) {
      newErrors.employeeId = "従業員番号は数字のみで入力してください。";
    }

    if (!employee.name) {
      newErrors.name = "氏名を入力してください。";
    } else if (!nameRegex.test(employee.name)) {
      newErrors.name =
        "氏名は半角スペースで姓と名を区切ってください。（例: 山田 太郎）";
    }

    if (!employee.workArea) {
      newErrors.workArea = "担当を選択してください。";
    }

    if (!employee.role) {
      newErrors.role = "雇用形態を選択してください。";
    }

    if (!employee.password) {
      newErrors.password = "パスワードを入力してください。";
    } else if (employee.password.length < 8) {
      newErrors.password = "パスワードは8文字以上で入力してください。";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true);
    navigate("/confirmemployee", { state: employee });
  };

  return (
    <div className="register-container">
      <h1>従業員登録</h1>
      <form onSubmit={handleSubmit} className="register-form">
        <label>従業員番号</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          name="employeeId"
          autoComplete="off"
          value={employee.employeeId}
          onChange={handleChange}
          placeholder="例: 001234"
        />
        {errors.employeeId && (
          <p className="error-message">{errors.employeeId}</p>
        )}

        <label>氏名</label>
        <input
          type="text"
          name="name"
          autoComplete="name"
          value={employee.name}
          onChange={handleChange}
          placeholder="例: 山田 太郎"
        />
        {errors.name && <p className="error-message">{errors.name}</p>}

        <label>担当</label>
        <select
          name="workArea"
          value={employee.workArea}
          onChange={handleChange}
        >
          <option value="">選択してください</option>
          <option value="キッチン">キッチン</option>
          <option value="ホール">ホール</option>
          <option value="キッチン&ホール">キッチン&ホール</option>
        </select>
        {errors.workArea && <p className="error-message">{errors.workArea}</p>}

        <label className="checkbox">
          <input
            type="checkbox"
            name="isInternational"
            checked={employee.isInternational}
            onChange={(e) =>
              setEmployee((prev) => ({
                ...prev,
                isInternational: e.target.checked,
              }))
            }
          />
          留学生です
        </label>

        <label>雇用形態</label>
        <select name="role" value={employee.role} onChange={handleChange}>
          <option value="">選択してください</option>
          <option value="社員">社員</option>
          <option value="パート">パート</option>
          <option value="アルバイト">アルバイト</option>
        </select>
        {errors.role && <p className="error-message">{errors.role}</p>}

        <label>パスワード</label>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          value={employee.password}
          onChange={handleChange}
          placeholder="パスワードを入力"
        />
        {errors.password && <p className="error-message">{errors.password}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "確認へ…" : "確認"}
        </button>
      </form>
    </div>
  );
};

export default RegisterEmployee;
