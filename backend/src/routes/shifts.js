const express = require("express");
const prisma = require("../prisma");
const { auth, requireAdmin } = require("../middleware/auth");
const { DAY7, rollingLimitExceeded } = require("../utils/timeWindow");

const router = express.Router();

// 一覧（mine/today対応）
router.get("/", auth(false), async (req, res) => {
  const { from, to, userId, role, mine, today } = req.query;
  let where = {};
  if (mine === "true" && req.auth) where.userId = req.auth.uid;
  else if (userId) where.userId = Number(userId);
  if (role) where.role = role;

  if (today === "true") {
    const now = new Date(),
      start = new Date(now),
      end = new Date(now);
    start.setHours(0, 0, 0, 0);
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
      user: { select: { id: true, name: true, role: true, isForeign: true } },
    },
    orderBy: [{ start: "asc" }],
  });
  res.json(list);
});

// 管理者: 確定シフト作成
router.post("/", auth(), requireAdmin, async (req, res) => {
  const { userId, role, start, end } = req.body || {};
  if (!userId || !role || !start || !end)
    return res
      .status(400)
      .json({ error: "userId, role, start, end are required" });

  const s = new Date(start),
    e = new Date(end);
  if (!(s < e))
    return res.status(400).json({ error: "end must be after start" });

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return res.status(404).json({ error: "user not found" });

  const overlap = await prisma.shift.findFirst({
    where: {
      userId: Number(userId),
      status: "ASSIGNED",
      NOT: [{ end: { lte: s } }, { start: { gte: e } }],
    },
  });
  if (overlap)
    return res.status(400).json({ error: "既存シフトと重複しています" });

  if (user.isForeign) {
    const existing = await prisma.shift.findMany({
      where: {
        userId: Number(userId),
        status: "ASSIGNED",
        NOT: [
          { end: { lte: new Date(s.getTime() - DAY7) } },
          { start: { gte: e } },
        ],
      },
      orderBy: { start: "asc" },
    });
    const check = rollingLimitExceeded(existing, { start: s, end: e }, 28);
    if (check.exceeded) {
      return res.status(400).json({
        error: "留学生は、どの連続7日でも合計28時間を超えて勤務できません",
        detail: {
          maxHours: check.maxHours,
          windowStart: check.worst?.start.toISOString(),
          windowEnd: check.worst?.end.toISOString(),
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
    res.status(201).json(created);
  } catch (e) {
    if (e && e.code === "P2002")
      return res.status(400).json({ error: "同一のシフトは登録できません" });
    throw e;
  }
});

router.delete("/:id", auth(), requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const found = await prisma.shift.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ error: "shift not found" });
  await prisma.shift.delete({ where: { id } });
  res.status(204).end();
});

// 申請（従業員）
router.post("/requests", auth(), async (req, res) => {
  const { role, start, end } = req.body || {};
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

// 申請一覧（管理者）
router.get("/requests", auth(), requireAdmin, async (_req, res) => {
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

// 申請承認
router.post("/requests/:id/approve", auth(), requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!shift || shift.status !== "REQUESTED")
    return res.status(404).json({ error: "request not found" });

  const overlap = await prisma.shift.findFirst({
    where: {
      userId: shift.userId,
      status: "ASSIGNED",
      NOT: [{ end: { lte: shift.start } }, { start: { gte: shift.end } }],
    },
  });
  if (overlap)
    return res.status(400).json({ error: "既存シフトと重複しています" });

  if (shift.user?.isForeign) {
    const existing = await prisma.shift.findMany({
      where: {
        userId: shift.userId,
        status: "ASSIGNED",
        NOT: [
          { end: { lte: new Date(shift.start.getTime() - DAY7) } },
          { start: { gte: shift.end } },
        ],
      },
      orderBy: { start: "asc" },
    });
    const check = rollingLimitExceeded(
      existing,
      { start: shift.start, end: shift.end },
      28
    );
    if (check.exceeded) {
      return res.status(400).json({
        error: "留学生は、どの連続7日でも合計28時間を超えて勤務できません",
        detail: {
          maxHours: check.maxHours,
          windowStart: check.worst?.start.toISOString(),
          windowEnd: check.worst?.end.toISOString(),
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
    res.json(updated);
  } catch (e) {
    if (e && e.code === "P2002")
      return res.status(400).json({ error: "同一のシフトは登録できません" });
    throw e;
  }
});

// 申請却下
router.post("/requests/:id/reject", auth(), requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift || shift.status !== "REQUESTED")
    return res.status(404).json({ error: "request not found" });
  await prisma.shift.delete({ where: { id } });
  res.status(204).end();
});

module.exports = router;
