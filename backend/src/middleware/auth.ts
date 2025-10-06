import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

export type JwtClaims = {
  sub?: string | number; // sub は文字列でも数値でも来うるので union に
  role: "admin" | "employee";
  employee_id: number;
  name: string;
  iat?: number;
  exp?: number;
};

// 実行時バリデーション用のスキーマ
const ClaimsSchema = z
  .object({
    sub: z.union([z.string(), z.number()]).optional(),
    role: z.enum(["admin", "employee"]),
    employee_id: z.number(),
    name: z.string(),
    iat: z.number().optional(),
    exp: z.number().optional(),
  })
  .passthrough();

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const decoded = jwt.verify(
      header.slice(7),
      process.env.JWT_SECRET as string,
      {
        issuer: "web-shift-manager",
        audience: "web",
      }
    );

    // verify は string か object を返すのでまず絞り込み
    if (typeof decoded === "string") {
      return res.status(401).json({ error: "invalid_token" });
    }

    // 実行時に shape を検証してから型付け
    const parsed = ClaimsSchema.safeParse(decoded);
    if (!parsed.success) {
      return res.status(401).json({ error: "invalid_token" });
    }

    // Express の型拡張があればそれで、なければ any で代入
    (req as any).user = parsed.data as JwtClaims;
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function requireRole(...roles: Array<JwtClaims["role"]>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role as JwtClaims["role"] | undefined;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  };
}
