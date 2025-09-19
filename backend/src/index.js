const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

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

// ひとまず重複チェック付きのシフト作成と取得だけ
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

  const overlap = await prisma.shift.findFirst({
    where: {
      userId: Number(userId),
      NOT: [{ end: { lte: s } }, { start: { gte: e } }],
    },
  });
  if (overlap)
    return res.status(400).json({ error: "既存シフトと重複しています" });

  const created = await prisma.shift.create({
    data: { userId: Number(userId), role, start: s, end: e },
  });
  res.status(201).json(created);
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`API running on :${port}`));
