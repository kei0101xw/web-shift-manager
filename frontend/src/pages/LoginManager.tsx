import React, { useState, ChangeEvent, FormEvent } from "react";
import "./LoginEmployee.css";

type Errors = {
  emailOrId?: string;
  password?: string;
};

export default function LoginFormManager(): JSX.Element {
  const [emailOrId, setEmailOrId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): boolean => {
    const newErrors: Errors = {};
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

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!validate()) return;

    // バリデーションOK時の処理
    console.log("ログイン:", { emailOrId, password });
  };

  const handleEmailOrIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmailOrId(e.target.value);
    if (errors.emailOrId) {
      setErrors((prev) => ({ ...prev, emailOrId: undefined }));
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  return (
    <>
      <div className="login-em-container">
        <div className="login-le-container">
          <form onSubmit={handleSubmit} className="login-form__input">
            <h1 className="login-employee-title">ログイン(管理者)</h1>

            <input
              id="emailOrId"
              type="text"
              value={emailOrId}
              onChange={handleEmailOrIdChange}
              className={`login-form__input__email ${
                errors.emailOrId ? "login-form__input__email--error" : ""
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
              onChange={handlePasswordChange}
              className={`login-form__input__pass ${
                errors.password ? "login-form__input__pass--error" : ""
              }`}
              placeholder="パスワード"
            />
            {errors.password && (
              <p className="login-form__error">{errors.password}</p>
            )}

            {/* パスワードを忘れた方はこちら */}
            <div className="login-form__forgot-wrapper">
              <a href="/forgot-password" className="login-form__forgot-link">
                パスワードを忘れた方はこちら
              </a>
            </div>

            {/* ログインボタン */}
            <button type="submit" className="login-form__submit-button">
              ログイン
            </button>

            {/* 管理者の方はこちら */}
            <button
              type="button"
              onClick={() => (window.location.href = "/admin-login")}
              className="login-form__admin-button"
            >
              従業員の方はこちら ＞
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
