const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma");
const { auth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth(), requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
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

router.post("/", auth(), requireAdmin, async (req, res) => {
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
  } = req.body || {};
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

router.delete("/:id", auth(), requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "user not found" });
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(409).json({ error: "シフトが残っているため削除できません" });
  }
});

module.exports = router;
