import express from "express";
import cors from "cors";
import helmet from "helmet";
import { employeesRouter } from "./routes/employees.routes";
import { shiftsRouter } from "./routes/shifts.routes";
import { assignmentsRouter } from "./routes/assignments.routes";
import { availabilityRouter } from "./routes/availability.routes";
import { todayRouter } from "./routes/today.routes";
import { meRouter } from "./routes/me.routes";
import { gapsRouter } from "./routes/gaps.routes";
import { authRouter } from "./routes/auth.routes";
import { authGuard, requireRole } from "./middleware/auth";
import { errorHandler } from "./errors";

const app = express();

// ミドルウェア
app.use(cors());
app.use(helmet());
app.use(express.json());

// 公開エンドポイント
app.get("/healthz", (_req, res) => res.sendStatus(200));
app.use("/api/v1/auth", authRouter);

// 以降は要ログイン
app.use("/api/v1", authGuard);

// ルータ（必要なら一部を requireRole('admin') で保護）
app.use("/api/v1/employees", employeesRouter);
// app.use("/api/v1/employees", requireRole("admin"), employeesRouter);

// ルータ
app.use("/api/v1/shifts", authGuard, shiftsRouter);
app.use("/api/v1/assignments", authGuard, assignmentsRouter);
app.use("/api/v1/availability", authGuard, availabilityRouter);
app.use("/api/v1/today", authGuard, todayRouter);
app.use("/api/v1/me", authGuard, meRouter);
app.use("/api/v1/gaps", authGuard, requireRole("admin"), gapsRouter);

// エラーハンドラ
app.use(errorHandler);

export default app;
