/*
  Warnings:

  - A unique constraint covering the columns `[hardwareId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "hardwareId" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "User_hardwareId_key" ON "User"("hardwareId");
