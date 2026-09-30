/*
  Warnings:

  - The required column `familyId` was added to the `sessions` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- Invalidate all existing sessions (forces one-time re-login and allows adding NOT NULL familyId column)
DELETE FROM "sessions";

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "familyId" TEXT NOT NULL,
ADD COLUMN     "isRevoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "sessions_familyId_idx" ON "sessions"("familyId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");
