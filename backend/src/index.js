require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// ===== CORS（← ここで app.use(cors()) を置き換え）=====
const allowOrigin = process.env.ALLOW_ORIGIN || "*";
// 複数オリジンはカンマ区切り: "http://localhost:3000,https://staging.example.com"
app.use(
  cors({
    origin: allowOrigin === "*" ? true : allowOrigin.split(","),
    credentials: false,
  })
);

app.use(express.json());

// ===== ユーティリティ（rolling 7日=28h 用）=====
const HOUR = 1000 * 60 * 60;
const DAY7 = 7 * 24 * HOUR;
const clipMs = (aS, aE, bS, bE) =>
  Math.max(
    0,
    Math.min(aE.getTime(), bE.getTime()) - Math.max(aS.getTime(), bS.getTime())
  );

// ===== Health =====
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ===== Users =====
app.get("/api/users", async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
  res.json(users);
});

app.post("/api/users", async (req, res) => {
  const { name, role, isForeign = false } = req.body;
  if (!name || !role)
    return res.status(400).json({ error: "name & role required" });
  const user = await prisma.user.create({
    data: { name, role, isForeign: !!isForeign },
  });
  res.status(201).json(user);
});

app.delete("/api/users/:id", async (req, res) => {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

// ===== Shifts =====
app.get("/api/shifts", async (req, res) => {
  const { from, to, userId, role } = req.query;
  const where = {
    ...(userId ? { userId: Number(userId) } : {}),
    ...(role ? { role } : {}),
    ...(from || to
      ? {
          start: { gte: from ? new Date(from) : undefined },
          end: { lte: to ? new Date(to) : undefined },
        }
      : {}),
  };
  const shifts = await prisma.shift.findMany({
    where,
    include: { user: true },
    orderBy: [{ start: "asc" }],
  });
  res.json(shifts);
});

app.post("/api/shifts", async (req, res) => {
  const { userId, role, start, end } = req.body;
  if (!userId || !role || !start || !end)
    return res
      .status(400)
      .json({ error: "userId, role, start, end are required" });

  const s = new Date(start);
  const e = new Date(end);
  if (!(s < e))
    return res.status(400).json({ error: "end must be after start" });

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return res.status(404).json({ error: "user not found" });

  // 重複禁止（NOT (end<=start || start>=end)）
  const overlap = await prisma.shift.findFirst({
    where: {
      userId: Number(userId),
      NOT: [{ end: { lte: s } }, { start: { gte: e } }],
    },
  });
  if (overlap)
    return res.status(400).json({ error: "既存シフトと重複しています" });

  // 留学生: どの連続7日でも28h以内（rolling window）
  if (user.isForeign) {
    const rangeStart = new Date(s.getTime() - DAY7);
    const rangeEnd = e;
    const existing = await prisma.shift.findMany({
      where: {
        userId: Number(userId),
        NOT: [{ end: { lte: rangeStart } }, { start: { gte: rangeEnd } }],
      },
      orderBy: { start: "asc" },
    });

    const intervals = [
      ...existing.map((x) => ({
        start: new Date(x.start),
        end: new Date(x.end),
      })),
      { start: s, end: e }, // 今回の候補
    ];

    // 任意の7日窓の最大は境界に合わせた窓で達成される
    const boundaries = [];
    for (const iv of intervals) boundaries.push(iv.start, iv.end);

    let maxHours = 0;
    let worst = null;
    for (const t of boundaries) {
      const wStart = new Date(t.getTime() - DAY7);
      const wEnd = t;
      let sumMs = 0;
      for (const iv of intervals)
        sumMs += clipMs(iv.start, iv.end, wStart, wEnd);
      const hours = sumMs / HOUR;
      if (hours > maxHours) {
        maxHours = hours;
        worst = { start: wStart, end: wEnd };
      }
    }

    if (maxHours > 28) {
      return res.status(400).json({
        error: "留学生は、どの連続7日でも合計28時間を超えて勤務できません",
        detail: {
          maxHours: Number(maxHours.toFixed(2)),
          windowStart: worst?.start.toISOString(),
          windowEnd: worst?.end.toISOString(),
          limit: 28,
        },
      });
    }
  }

  const created = await prisma.shift.create({
    data: { userId: Number(userId), role, start: s, end: e },
  });
  res.status(201).json(created);
});

// ← ここに DELETE /api/shifts を追加
app.delete("/api/shifts/:id", async (req, res) => {
  const id = Number(req.params.id);
  const found = await prisma.shift.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ error: "shift not found" });
  await prisma.shift.delete({ where: { id } });
  res.status(204).end();
});

// ===== エラーハンドラ（全ルート定義の“後”）=====
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal error" });
});

// ===== 終了シグナルでDB切断（安定運用）=====
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// ===== Start =====
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API running on :${port}`));
