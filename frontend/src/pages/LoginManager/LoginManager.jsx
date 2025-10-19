import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./LoginManager.css";

export default function LoginManager() {
  const [employee_code, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!employee_code.trim())
      newErrors.employee_code = "従業員番号を入力してください。";
    if (!password) newErrors.password = "パスワードを入力してください。";
    else if (password.length < 8)
      newErrors.password = "パスワードは8文字以上で入力してください。";
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
      // 権限に応じて遷移先を分ける
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
    <div className="login-mn-container">
      <div className="login-manager-container">
        <form onSubmit={handleSubmit} className="login-form-input">
          <h1 className="login-manager-title">ログイン(管理者)</h1>

          {/* 従業員番号 */}
          <input
            id="employee_code"
            type="text"
            value={employee_code}
            onChange={(e) => setEmployeeCode(e.target.value)}
            className={`login-form-input-email ${
              errors.employee_code ? "login-form-input-mail-error" : ""
            }`}
            placeholder="従業員番号（例: ADMIN001）"
            autoComplete="username"
          />
          {errors.employee_code && (
            <p className="login-form__error">{errors.employee_code}</p>
          )}

          {/* パスワード */}
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
            <p className="login-form__error">{errors.password}</p>
          )}
          {serverErr && <p className="login-form__error">{serverErr}</p>}

          {/* パスワードを忘れた方はこちら */}
          <div className="login-form-forgot-wrapper">
            <a href="/forgot-password" className="login-form-forgot-link">
              パスワードを忘れた方はこちら
            </a>
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            className="login-form-submit-button"
            disabled={busy}
          >
            {busy ? "ログイン中…" : "ログイン"}
          </button>

          {/* 従業員ログイン */}
          <Link to="/loginemployee" className="login-form__employee-button">
            従業員の方はこちら ＞
          </Link>
        </form>
      </div>
    </div>
  );
}
