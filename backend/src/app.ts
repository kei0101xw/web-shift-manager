import express from "express";
import cors from "cors";
import helmet from "helmet";
import { employeesRouter } from "./routes/employees.routes";

const app = express();

// ミドルウェア
app.use(cors());
app.use(helmet());
app.use(express.json());

// ルータ
app.use("/api/v1/employees", employeesRouter);

// エクスポート
export default app;
