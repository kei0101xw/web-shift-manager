/*
  Warnings:

  - A unique constraint covering the columns `[userId,start,end]` on the table `Shift` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Shift_userId_start_end_key" ON "Shift"("userId", "start", "end");
