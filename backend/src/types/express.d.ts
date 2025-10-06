import type { JwtClaims } from "../auth/auth.guard";
declare module "express-serve-static-core" {
  interface Request {
    user?: JwtClaims;
  }
}

// この行があるとこのファイル自体がモジュール扱いになり、型解決が安定します
export {};
