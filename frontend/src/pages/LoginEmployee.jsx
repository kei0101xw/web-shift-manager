import React, { useState } from "react";
import "./LoginEmployee.css"; // CSSのインポート
import Header from "../components/Header";

export default function LoginFormEmployee() {
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    // メールアドレスまたは従業員番号（数値）
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const idRegex = /^[0-9]+$/;

    if (!emailOrId) {
      newErrors.emailOrId =
        "メールアドレスまたは従業員番号を入力してください。";
    } else if (!emailRegex.test(emailOrId) && !idRegex.test(emailOrId)) {
      newErrors.emailOrId =
        "有効なメールアドレスまたは従業員番号を入力してください。";
    }

    // パスワード：4〜8桁
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

    // バリデーションOK時の処理
    console.log("ログイン:", { emailOrId, password });
  };

  return (
    <>
      <Header />
      <div className="login-em-container">
        <div className="login-le-container">
          <form onSubmit={handleSubmit} className="login-form-input">
            <h2 className=".login-employee-title">ログイン(従業員)</h2>

            {/* メールアドレス / 従業員番号 */}
            <input
              id="emailOrId"
              type="text"
              value={emailOrId}
              onChange={(e) => setEmailOrId(e.target.value)}
              className={`login-form-input-email ${
                errors.emailOrId ? "login-form-input-email-error" : ""
              }`}
              placeholder="メールアドレスまたは従業員番号"
            />
            {errors.emailOrId && (
              <p className="login-form-error">{errors.emailOrId}</p>
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
              <p className="login-form-error">{errors.password}</p>
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

            {/* 管理者の方はこちら */}
            <button
              type="button"
              onClick={() => (window.location.href = "/admin-login")}
              className="login-form-admin-button"
            >
              管理者の方はこちら ＞
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
