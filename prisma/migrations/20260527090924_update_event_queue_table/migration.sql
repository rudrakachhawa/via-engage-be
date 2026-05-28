/*
  Warnings:

  - The values [DM_SENT,COMMENT_REPLIED,EXPIRED] on the enum `EventStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `triggeredAt` on the `EventQueue` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dedupeKey]` on the table `EventQueue` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scheduledFor` to the `EventQueue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
ALTER TABLE "public"."EventQueue" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "EventQueue" ALTER COLUMN "status" TYPE "EventStatus_new" USING ("status"::text::"EventStatus_new");
ALTER TYPE "EventStatus" RENAME TO "EventStatus_old";
ALTER TYPE "EventStatus_new" RENAME TO "EventStatus";
DROP TYPE "public"."EventStatus_old";
ALTER TABLE "EventQueue" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "EventQueue_status_priority_triggeredAt_idx";

-- AlterTable
ALTER TABLE "EventQueue" DROP COLUMN "triggeredAt",
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledFor" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "rawPayload" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EventQueue_dedupeKey_key" ON "EventQueue"("dedupeKey");

-- CreateIndex
CREATE INDEX "EventQueue_status_priority_idx" ON "EventQueue"("status", "priority");
