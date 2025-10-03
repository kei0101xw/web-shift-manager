import { Response, Request, NextFunction } from "express";
import { ZodError } from "zod";

export function sendPgError(res: Response, err: any) {
  const code = err?.code as string | undefined;
  if (code === "23505")
    return res
      .status(409)
      .json({ error: "unique_violation", detail: err.detail });
  if (code === "23503")
    return res
      .status(400)
      .json({ error: "foreign_key_violation", detail: err.detail });
  if (code === "23514")
    return res
      .status(400)
      .json({ error: "check_violation", detail: err.message });
  if (code === "23P01")
    return res
      .status(409)
      .json({ error: "exclusion_violation", detail: err.detail });
  if (err?.name === "BadRequest")
    return res.status(400).json({ error: err.message, meta: err.meta });
  return res.status(500).json({ error: "internal_error", detail: String(err) });
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ZodError) {
    return res
      .status(422)
      .json({ error: "validation_error", issues: err.issues });
  }
  return sendPgError(res, err);
}
