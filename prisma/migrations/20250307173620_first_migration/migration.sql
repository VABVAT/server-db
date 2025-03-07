-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "hardwareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_key_key" ON "User"("key");

-- CreateIndex
CREATE UNIQUE INDEX "User_hardwareId_key" ON "User"("hardwareId");
