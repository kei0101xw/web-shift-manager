const { PrismaClient } = require("@prisma/client");

// nodemonで再読み込みしても1個だけにする
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

module.exports = prisma;
