import { Response, Request, NextFunction } from "express";
import { ZodError } from "zod";

export function sendPgError(res: Response, err: any) {
  const code = err?.code as string | undefined;

  // よくある系：一意制約/外部キー/チェック/排他
  if (code === "23505")
    return res
      .status(409)
      .json({
        error: "unique_violation",
        detail: err.detail,
        constraint: err.constraint,
      });
  if (code === "23503")
    return res
      .status(400)
      .json({
        error: "foreign_key_violation",
        detail: err.detail,
        constraint: err.constraint,
      });
  if (code === "23514")
    return res
      .status(400)
      .json({
        error: "check_violation",
        detail: err.message,
        constraint: err.constraint,
      });
  if (code === "23P01")
    return res
      .status(409)
      .json({
        error: "exclusion_violation",
        detail: err.detail,
        constraint: err.constraint,
      });

  // フィールド関連
  if (code === "23502")
    return res
      .status(400)
      .json({
        error: "not_null_violation",
        detail: err.column || err.detail,
        constraint: err.constraint,
      });
  if (code === "22P02")
    return res
      .status(400)
      .json({ error: "invalid_text_representation", detail: err.detail }); // 例: 数値/UUID変換失敗

  // 競合/同時実行（リトライ候補）
  if (code === "40001")
    return res
      .status(409)
      .json({
        error: "serialization_failure",
        retryable: true,
        detail: err.detail,
      });
  if (code === "40P01")
    return res
      .status(409)
      .json({
        error: "deadlock_detected",
        retryable: true,
        detail: err.detail,
      });

  // アプリ側で投げたエラー
  if (err?.name === "Conflict")
    return res
      .status(409)
      .json({ error: err.message || "conflict", meta: err.meta });
  if (err?.name === "BadRequest")
    return res.status(400).json({ error: err.message, meta: err.meta });

  // フォールバック
  return res.status(500).json({ error: "internal_error", detail: String(err) });
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) return next(err); // 既に書き出し始めていたらExpressに委譲
  if (err instanceof ZodError) {
    return res
      .status(422)
      .json({ error: "validation_error", issues: err.issues });
  }
  return sendPgError(res, err);
}
