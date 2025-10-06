import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { pool } from "../db/client";
import { sendPgError } from "../errors";

export const authRouter = Router();

// 1) 秘密鍵の確定（未設定なら起動時に落とす）
const secretEnv = process.env.JWT_SECRET;
if (!secretEnv) {
  throw new Error("JWT_SECRET is not set");
}
const secret: Secret = secretEnv;

// 2) 期限の設定（JWT 用の文字列/数値 と、クライアント表示用の秒数）
const raw = process.env.JWT_EXPIRES_IN || "7d";
let expiresInSeconds = /^\d+$/.test(raw) ? Number(raw) : toSeconds(raw);
if (!expiresInSeconds) expiresInSeconds = 7 * 24 * 3600;

const signOptions: SignOptions = {
  expiresIn: expiresInSeconds,
  issuer: "web-shift-manager",
  audience: "web",
};

function toSeconds(v: string): number {
  const m = /^(\d+)(s|m|h|d)?$/.exec(v);
  if (!m) return 0;
  const n = Number(m[1]);
  const u = m[2] || "s";
  return n * (u === "m" ? 60 : u === "h" ? 3600 : u === "d" ? 86400 : 1);
}

const LoginSchema = z.object({
  employee_code: z.string().min(1), // 従業員番号でログイン
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  try {
    const { employee_code, password } = LoginSchema.parse(req.body);

    const {
      rows: [row],
    } = await pool.query(
      `
      select
        u.id as user_id, u.username, u.password_hash, u.role, u.is_active,
        e.id as employee_id, e.name, e.status as emp_status
      from employees e
      join users u on u.id = e.user_id
      where e.employee_code = $1
      limit 1
      `,
      [employee_code]
    );

    // 認証失敗はメッセージをぼかす
    if (
      !row ||
      row.emp_status !== "active" ||
      !row.is_active ||
      !(await bcrypt.compare(password, row.password_hash))
    ) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const payload = {
      sub: row.user_id,
      role: row.role as "admin" | "employee",
      employee_id: row.employee_id as number,
      name: row.name as string,
    };

    const token = jwt.sign(payload, secret, signOptions);

    res.json({
      access_token: token,
      token_type: "Bearer",
      expires_in: expiresInSeconds, // クライアントが扱いやすい秒数
      user: {
        employee_id: row.employee_id,
        name: row.name,
        role: row.role,
      },
    });
  } catch (err) {
    return sendPgError(res, err);
  }
});

authRouter.get("/me", (req: any, res) => {
  // authGuard をこのルートに適用してから使う
  const u = req.user;
  if (!u) return res.status(401).json({ error: "unauthorized" });
  res.json({ user: u });
});
