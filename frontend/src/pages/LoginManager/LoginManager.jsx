import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./LoginManager.css";

export default function LoginManager() {
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const idRegex = /^[0-9]+$/;

    if (!emailOrId) {
      newErrors.emailOrId =
        "メールアドレスまたは従業員番号を入力してください。";
    } else if (!emailRegex.test(emailOrId) && !idRegex.test(emailOrId)) {
      newErrors.emailOrId =
        "有効なメールアドレスまたは従業員番号を入力してください。";
    }

    if (!password) {
      newErrors.password = "パスワードを入力してください。";
    } else if (password.length < 4 || password.length > 8) {
      newErrors.password = "パスワードは4〜8文字で入力してください。";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    console.log("ログイン:", { emailOrId, password });
  };

  return (
    <div className="login-mn-container">
      <div className="login-manager-container">
        <form onSubmit={handleSubmit} className="login-form-input">
          <h1 className="login-manager-title">ログイン(管理者)</h1>

          {/* メールアドレス / 従業員番号 */}
          <input
            id="emailOrId"
            type="text"
            value={emailOrId}
            onChange={(e) => setEmailOrId(e.target.value)}
            className={`login-form-input-email ${
              errors.emailOrId ? "login-form-input-mail-error" : ""
            }`}
            placeholder="メールアドレスまたは従業員番号"
          />
          {errors.emailOrId && (
            <p className="login-form__error">{errors.emailOrId}</p>
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
            placeholder="パスワード"
          />
          {errors.password && (
            <p className="login-form__error">{errors.password}</p>
          )}

          {/* パスワードを忘れた方はこちら */}
          <div className="login-form-forgot-wrapper">
            <a href="/forgot-password" className="login-form-forgot-link">
              パスワードを忘れた方はこちら
            </a>
          </div>

          {/* ログインボタン */}
          <button type="submit" className="login-form-submit-button">
            ログイン
          </button>

          {/* 従業員の方はこちら */}
          <Link to="/loginemployee" className="login-form__employee-button">
            従業員の方はこちら ＞
          </Link>
        </form>
      </div>
    </div>
  );
}
