require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

(async () => {
  try {
    const passwordHash = await bcrypt.hash("admin1234", 10);
    const admin = await prisma.user.upsert({
      where: { employeeNumber: "A0001" },
      update: {}, // 既に居れば何もしない
      create: {
        name: "管理者",
        role: "HALL",
        isForeign: false,
        employeeNumber: "A0001",
        passwordHash,
        isAdmin: true,
        employmentType: "EMPLOYEE",
        hourlyWage: 0,
      },
    });
    console.log("Seeded admin:", {
      id: admin.id,
      employeeNumber: admin.employeeNumber,
      isAdmin: admin.isAdmin,
    });
  } catch (e) {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
