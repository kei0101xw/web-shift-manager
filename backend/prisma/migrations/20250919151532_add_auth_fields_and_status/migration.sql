-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shift" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Shift" ("createdAt", "end", "id", "role", "start", "userId") SELECT "createdAt", "end", "id", "role", "start", "userId" FROM "Shift";
DROP TABLE "Shift";
ALTER TABLE "new_Shift" RENAME TO "Shift";
CREATE INDEX "Shift_userId_start_idx" ON "Shift"("userId", "start");
CREATE INDEX "Shift_start_end_idx" ON "Shift"("start", "end");
CREATE UNIQUE INDEX "Shift_userId_start_end_key" ON "Shift"("userId", "start", "end");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isForeign" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeNumber" TEXT,
    "passwordHash" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "employmentType" TEXT,
    "partTimeStart" DATETIME,
    "hourlyWage" INTEGER
);
INSERT INTO "new_User" ("createdAt", "id", "isForeign", "name", "role") SELECT "createdAt", "id", "isForeign", "name", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_employeeNumber_key" ON "User"("employeeNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
