import express from "express";
import cors from "cors";
import helmet from "helmet";
import { employeesRouter } from "./routes/employees.routes";
import { shiftsRouter } from "./routes/shifts.routes";
import { assignmentsRouter } from "./routes/assignments.routes";
import { availabilityRouter } from "./routes/availability.routes";
import { todayRouter } from "./routes/today.routes";
import { gapsRouter } from "./routes/gaps.routes";
import { errorHandler } from "./errors";

const app = express();

// ミドルウェア
app.use(cors());
app.use(helmet());
app.use(express.json());

// ルータ
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.use("/api/v1/employees", employeesRouter);
app.use("/api/v1/shifts", shiftsRouter);
app.use("/api/v1/assignments", assignmentsRouter);
app.use("/api/v1/availability", availabilityRouter);
app.use("/api/v1/today", todayRouter);
app.use("/api/v1/gaps", gapsRouter);

// エラーハンドラ
app.use(errorHandler);

export default app;
