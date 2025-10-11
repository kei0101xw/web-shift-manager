import React, { useState } from "react";
import "./LoginEmployee.css";
import { useAuth } from "../../auth/AuthContext"; // 既に作ったAuthContextを使用
import { useNavigate, Link } from "react-router-dom";

export default function LoginEmployee() {
  const [employee_code, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  const validate = () => {
    const newErrors = {};

    // 例: "E-123456" や "ADM-0001" など。形式が色々あり得るので、ここでは「空でない」程度に。
    if (!employee_code.trim()) {
      newErrors.employee_code = "従業員番号を入力してください。";
    }

    // パスワード: 8文字以上（上限は設けない）
    if (!password) {
      newErrors.password = "パスワードを入力してください。";
    } else if (password.length < 8) {
      newErrors.password = "パスワードは8文字以上で入力してください。";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErr("");
    if (!validate()) return;
    setBusy(true);
    try {
      const user = await login(employee_code.trim(), password);
      // 権限で遷移先を分岐（任意）
      nav(user.role === "admin" ? "/managerhome" : "/home", { replace: true });
    } catch (err) {
      const msg =
        err?.data?.error === "invalid_credentials"
          ? "従業員番号またはパスワードが違います。"
          : "ログインに失敗しました。時間をおいて再度お試しください。";
      setServerErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-em-container">
      <div className="login-le-container">
        <form onSubmit={handleSubmit} className="login-form-input">
          <h2 className="login-employee-title">ログイン(従業員)</h2>
          {/* 従業員番号 */}
          <label htmlFor="employee_code" className="sr-only">
            従業員番号
          </label>{" "}
          {/* visually-hiddenなクラスを当てると良い */}
          <input
            id="employee_code"
            type="text"
            value={employee_code}
            onChange={(e) => setEmployeeCode(e.target.value)}
            className={`login-form-input-email ${
              errors.employee_code ? "login-form-input-email-error" : ""
            }`}
            placeholder="従業員番号（例: E-291138）"
            autoComplete="username"
          />
          {errors.employee_code && (
            <p className="login-form-error">{errors.employee_code}</p>
          )}
          {/* パスワード */}
          <label htmlFor="password" className="sr-only">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`login-form-input-pass ${
              errors.password ? "login-form-input-pass-error" : ""
            }`}
            placeholder="パスワード（8文字以上）"
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="login-form-error">{errors.password}</p>
          )}
          {serverErr && <p className="login-form-error">{serverErr}</p>}
          {/* パスワードを忘れた方（未実装ならダミーでもOK） */}
          <div className="login-form-forgot-wrapper">
            <a href="/forgot-password" className="login-form-forgot-link">
              パスワードを忘れた方はこちら
            </a>
          </div>
          <button
            type="submit"
            className="login-form-submit-button"
            disabled={busy}
          >
            {busy ? "ログイン中…" : "ログイン"}
          </button>
          {/* 管理者ログイン */}
          <Link to="/loginmanager" className="login-form-admin-button">
            管理者の方はこちら ＞
          </Link>
        </form>
      </div>
    </div>
  );
}
