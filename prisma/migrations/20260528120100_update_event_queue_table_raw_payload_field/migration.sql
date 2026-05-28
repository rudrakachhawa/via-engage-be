/*
  Warnings:

  - The values [COMPLETED] on the enum `EventStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `dedupeKey` on the `EventQueue` table. All the data in the column will be lost.
  - You are about to drop the column `jobId` on the `EventQueue` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `EventQueue` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledFor` on the `EventQueue` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'DM_SENT', 'COMMENT_REPLIED', 'FAILED', 'EXPIRED');
ALTER TABLE "public"."EventQueue" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "EventQueue" ALTER COLUMN "status" TYPE "EventStatus_new" USING ("status"::text::"EventStatus_new");
ALTER TYPE "EventStatus" RENAME TO "EventStatus_old";
ALTER TYPE "EventStatus_new" RENAME TO "EventStatus";
DROP TYPE "public"."EventStatus_old";
ALTER TABLE "EventQueue" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "EventQueue_dedupeKey_key";

-- DropIndex
DROP INDEX "EventQueue_igUserId_status_idx";

-- DropIndex
DROP INDEX "EventQueue_status_priority_idx";

-- AlterTable
ALTER TABLE "EventQueue" DROP COLUMN "dedupeKey",
DROP COLUMN "jobId",
DROP COLUMN "processedAt",
DROP COLUMN "scheduledFor",
ADD COLUMN     "triggeredAt" TIMESTAMP(3),
ALTER COLUMN "expiresAt" DROP NOT NULL;
