const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma");
const { auth, signToken } = require("../middleware/auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { employeeNumber, password } = req.body || {};
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

router.get("/me", auth(), async (req, res) => {
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

module.exports = router;
