require("dotenv").config();
const express = require("express");
const cors = require("cors");
const prisma = require("./prisma");

const allowOrigin = process.env.ALLOW_ORIGIN || "*";
const app = express();

app.use(
  cors({
    origin: allowOrigin === "*" ? true : allowOrigin.split(","),
    credentials: false,
  })
);
app.use(express.json());

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ルーティング
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/shifts", require("./routes/shifts"));

const { auth } = require("./middleware/auth");
app.get("/api/me", auth(), async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.auth.uid },
    select: {
      id: true,
      name: true,
      role: true,
      isForeign: true,
      createdAt: true,
      employeeNumber: true,
      isAdmin: true,
      employmentType: true,
      partTimeStart: true,
      hourlyWage: true,
    },
  });
  res.json(me);
});

// エラーハンドラ（最後）
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal error" });
});

// 優雅終了
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
