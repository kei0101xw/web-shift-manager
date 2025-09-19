require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// ===== CORS（← ここで app.use(cors()) を置き換え）=====
const allowOrigin = process.env.ALLOW_ORIGIN || "*";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || "7d";

function signToken(user) {
  return jwt.sign({ uid: user.id, isAdmin: !!user.isAdmin }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

function auth(required = true) {
  return (req, res, next) => {
    const h = req.headers.authorization || "";
    const m = h.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      if (required) return res.status(401).json({ error: "unauthorized" });
      return next();
    }
    try {
      req.auth = jwt.verify(m[1], JWT_SECRET);
      next();
    } catch {
      return res.status(401).json({ error: "invalid token" });
    }
  };
}

function requireAdmin(req, res, next) {
  if (!req.auth?.isAdmin) return res.status(403).json({ error: "forbidden" });
  next();
}

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
app.get("/api/users", auth(), requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    // 返すフィールドを明示（passwordHashは絶対に返さない）
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
  res.json(users);
});

app.post("/api/users", auth(), requireAdmin, async (req, res) => {
  const {
    name,
    role,
    isForeign = false,
    employeeNumber,
    password,
    employmentType,
    partTimeStart,
    hourlyWage,
    isAdmin = false,
  } = req.body;

  if (!name || !role)
    return res.status(400).json({ error: "name & role required" });
  if (!employeeNumber)
    return res.status(400).json({ error: "employeeNumber required" });
  if (!password) return res.status(400).json({ error: "password required" });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      role,
      isForeign: !!isForeign,
      employeeNumber,
      passwordHash,
      isAdmin: !!isAdmin,
      employmentType: employmentType ?? null,
      partTimeStart: partTimeStart ? new Date(partTimeStart) : null,
      hourlyWage: hourlyWage ?? null,
    },
  });
  res.status(201).json(user);
});

app.delete("/api/users/:id", auth(), requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "user not found" });
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  } catch (e) {
    // Prisma の外部キー制約違反
    return res
      .status(409)
      .json({ error: "シフトが残っているため削除できません" });
  }
});

// ログイン（従業員番号＋パスワード）
app.post("/api/auth/login", async (req, res) => {
  const { employeeNumber, password } = req.body;
  if (!employeeNumber || !password)
    return res
      .status(400)
      .json({ error: "employeeNumber & password required" });

  const user = await prisma.user.findFirst({ where: { employeeNumber } });
  if (!user?.passwordHash)
    return res.status(401).json({ error: "invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  const token = signToken(user);
  res.json({ token });
});

// 自分のプロフィール
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

// ===== Shifts =====
// 従業員: 申請（REQUESTED）
app.post("/api/shift-requests", auth(), async (req, res) => {
  const { role, start, end } = req.body;
  if (!role || !start || !end)
    return res.status(400).json({ error: "role, start, end required" });

  const s = new Date(start),
    e = new Date(end);
  if (!(s < e))
    return res.status(400).json({ error: "end must be after start" });

  const created = await prisma.shift.create({
    data: { userId: req.auth.uid, role, start: s, end: e, status: "REQUESTED" },
  });
  res.status(201).json(created);
});

// 管理者: 申請一覧
app.get("/api/shift-requests", auth(), requireAdmin, async (_req, res) => {
  const list = await prisma.shift.findMany({
    where: { status: "REQUESTED" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          isForeign: true,
          employeeNumber: true,
        },
      },
    },
    orderBy: [{ start: "asc" }],
  });
  res.json(list);
});

// 管理者: 承認 → 28hチェックを通して ASSIGNED に更新
app.post(
  "/api/shift-requests/:id/approve",
  auth(),
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!shift || shift.status !== "REQUESTED")
      return res.status(404).json({ error: "request not found" });

    // 既存の POST /api/shifts と同じバリデーション（重複＆rolling 28h）をここで実行
    // → 成功したら status を ASSIGNED に更新
    // 既存ロジックの関数化が望ましいが、まずは最短で貼り付けでもOK

    // 重複
    const overlap = await prisma.shift.findFirst({
      where: {
        userId: shift.userId,
        status: "ASSIGNED",
        NOT: [{ end: { lte: shift.start } }, { start: { gte: shift.end } }],
      },
    });
    if (overlap)
      return res.status(400).json({ error: "既存シフトと重複しています" });

    // rolling 7days（留学生）
    if (shift.user?.isForeign) {
      const HOUR = 1000 * 60 * 60,
        DAY7 = 7 * 24 * HOUR;
      const clipMs = (aS, aE, bS, bE) =>
        Math.max(
          0,
          Math.min(aE.getTime(), bE.getTime()) -
            Math.max(aS.getTime(), bS.getTime())
        );
      const rangeStart = new Date(shift.start.getTime() - DAY7);
      const rangeEnd = shift.end;
      const existing = await prisma.shift.findMany({
        where: {
          userId: shift.userId,
          status: "ASSIGNED",
          NOT: [{ end: { lte: rangeStart } }, { start: { gte: rangeEnd } }],
        },
        orderBy: { start: "asc" },
      });
      const intervals = [
        ...existing.map((x) => ({
          start: new Date(x.start),
          end: new Date(x.end),
        })),
        { start: new Date(shift.start), end: new Date(shift.end) },
      ];
      const boundaries = [];
      for (const iv of intervals) boundaries.push(iv.start, iv.end);
      let maxHours = 0,
        worst = null;
      for (const t of boundaries) {
        const wStart = new Date(t.getTime() - DAY7),
          wEnd = t;
        let ms = 0;
        for (const iv of intervals)
          ms += clipMs(iv.start, iv.end, wStart, wEnd);
        const h = ms / HOUR;
        if (h > maxHours) {
          maxHours = h;
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

    try {
      const updated = await prisma.shift.update({
        where: { id },
        data: { status: "ASSIGNED" },
      });
      return res.json(updated);
    } catch (e) {
      if (e && e.code === "P2002") {
        // DBのユニーク制約（userId,start,end）に引っかかった
        return res.status(400).json({ error: "同一のシフトは登録できません" });
      }
      throw e; // それ以外は共通エラーハンドラへ
    }
  }
);

// 管理者: 却下
app.post(
  "/api/shift-requests/:id/reject",
  auth(),
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift || shift.status !== "REQUESTED")
      return res.status(404).json({ error: "request not found" });
    await prisma.shift.delete({ where: { id } });
    res.status(204).end();
  }
);

// 既存 GET /api/shifts を置き換え
app.get("/api/shifts", auth(false), async (req, res) => {
  const { from, to, userId, role, mine, today } = req.query;
  let where = {};

  if (mine === "true" && req.auth) where.userId = req.auth.uid;
  else if (userId) where.userId = Number(userId);

  if (role) where.role = role;

  if (today === "true") {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    where = {
      ...where,
      NOT: [{ end: { lte: start } }, { start: { gte: end } }],
    };
  } else if (from || to) {
    where = {
      ...where,
      start: { gte: from ? new Date(from) : undefined },
      end: { lte: to ? new Date(to) : undefined },
    };
  }

  const list = await prisma.shift.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, role: true, isForeign: true }, // passwordHash等は返さない
      },
    },
    orderBy: [{ start: "asc" }],
  });
  res.json(list);
});

app.post("/api/shifts", auth(), requireAdmin, async (req, res) => {
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

  // 既存ASSIGNEDとの重複禁止（NOT (end<=s || start>=e)）
  const overlap = await prisma.shift.findFirst({
    where: {
      userId: Number(userId),
      status: "ASSIGNED",
      NOT: [{ end: { lte: s } }, { start: { gte: e } }],
    },
  });
  if (overlap)
    return res.status(400).json({ error: "既存シフトと重複しています" });

  // 留学生: どの連続7日でも28h以内（ASSIGNED + 今回の候補で判定）
  if (user.isForeign) {
    const rangeStart = new Date(s.getTime() - DAY7);
    const rangeEnd = e;
    const existing = await prisma.shift.findMany({
      where: {
        userId: Number(userId),
        status: "ASSIGNED",
        NOT: [{ end: { lte: rangeStart } }, { start: { gte: rangeEnd } }],
      },
      orderBy: { start: "asc" },
    });

    const intervals = [
      ...existing.map((x) => ({
        start: new Date(x.start),
        end: new Date(x.end),
      })),
      { start: s, end: e },
    ];

    const boundaries = [];
    for (const iv of intervals) boundaries.push(iv.start, iv.end);

    let maxHours = 0,
      worst = null;
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

  try {
    const created = await prisma.shift.create({
      data: {
        userId: Number(userId),
        role,
        start: s,
        end: e,
        status: "ASSIGNED",
      },
    });
    return res.status(201).json(created);
  } catch (e) {
    if (e && e.code === "P2002") {
      return res.status(400).json({ error: "同一のシフトは登録できません" });
    }
    throw e;
  }
});

// ← ここに DELETE /api/shifts を追加
app.delete("/api/shifts/:id", auth(), requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const found = await prisma.shift.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ error: "shift not found" });
  await prisma.shift.delete({ where: { id } });
  res.status(204).end();
});

app.get("/api/pay", auth(), async (req, res) => {
  const mine = req.query.mine === "true";
  const uid = mine ? req.auth.uid : Number(req.query.userId || req.auth.uid);

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return res.status(404).json({ error: "user not found" });
  if (!mine && !req.auth.isAdmin)
    return res.status(403).json({ error: "forbidden" });
  if (!user.hourlyWage)
    return res.json({ totalHours: 0, hourlyWage: null, amount: 0 });

  const from = req.query.from
    ? new Date(req.query.from)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = req.query.to ? new Date(req.query.to) : new Date();

  const shifts = await prisma.shift.findMany({
    where: {
      userId: uid,
      status: "ASSIGNED",
      NOT: [{ end: { lte: from } }, { start: { gte: to } }],
    },
  });

  const ms = shifts.reduce((sum, s) => {
    const st = new Date(s.start),
      en = new Date(s.end);
    const ss = Math.max(st.getTime(), from.getTime());
    const ee = Math.min(en.getTime(), to.getTime());
    return sum + Math.max(0, ee - ss);
  }, 0);

  const hours = ms / (1000 * 60 * 60);
  const amount = Math.round(hours * user.hourlyWage);
  res.json({
    from: from.toISOString(),
    to: to.toISOString(),
    totalHours: Number(hours.toFixed(2)),
    hourlyWage: user.hourlyWage,
    amount,
  });
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
