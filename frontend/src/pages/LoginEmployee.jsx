import React, { useState } from "react";
import "./LoginEmployee.css"; // CSSのインポート
import Header from "../components/Header";

export default function LoginForm() {
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
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-md w-80"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              ログイン(従業員)
            </h2>

            {/* メールアドレス / 従業員番号 */}
            <label
              className="block mb-2 text-sm font-medium text-gray-700"
              htmlFor="emailOrId"
            >
              {/* メールアドレスまたは従業員番号 */}
            </label>
            <input
              id="emailOrId"
              type="text"
              value={emailOrId}
              onChange={(e) => setEmailOrId(e.target.value)}
              className={`w-full px-4 py-2 mb-1 border ${
                errors.emailOrId ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="メールアドレスまたは従業員番号"
            />
            {errors.emailOrId && (
              <p className="text-red-500 text-sm mb-2">{errors.emailOrId}</p>
            )}

            {/* パスワード */}
            <label
              className="block mb-2 text-sm font-medium text-gray-700"
              htmlFor="password"
            >
              {/* パスワード */}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 mb-1 border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              // placeholder="4〜8文字"
              placeholder="パスワード"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mb-2">{errors.password}</p>
            )}

            {/* パスワードを忘れた方はこちら */}
            <div className="text-right mb-4">
              <a
                href="/forgot-password"
                className="text-sm text-blue-500 hover:underline"
              >
                パスワードを忘れた方はこちら
              </a>
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              ログイン
            </button>

            {/* 管理者の方はこちら */}
            <button
              type="button"
              onClick={() => (window.location.href = "/admin-login")}
              className="w-full mt-2 border border-blue-500 text-blue-500 py-2 rounded-md hover:bg-blue-50 transition-colors"
            >
              管理者の方はこちら
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
