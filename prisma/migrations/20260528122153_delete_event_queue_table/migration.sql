/*
  Warnings:

  - You are about to drop the `EventQueue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventQueue" DROP CONSTRAINT "EventQueue_automationId_fkey";

-- DropForeignKey
ALTER TABLE "EventQueue" DROP CONSTRAINT "EventQueue_igUserId_fkey";

-- DropTable
DROP TABLE "EventQueue";

-- CreateTable
CREATE TABLE "MetaEvents" (
    "id" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "triggerType" "TriggerType" NOT NULL,
    "recipientIgId" TEXT NOT NULL,
    "recipientUsername" TEXT,
    "commentId" TEXT,
    "mediaId" TEXT,
    "commentText" TEXT,
    "rawPayload" JSONB,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "scheduledFor" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptedAt" TIMESTAMP(3),
    "errorLog" TEXT,
    "dedupeKey" TEXT,
    "jobId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetaEvents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MetaEvents_dedupeKey_key" ON "MetaEvents"("dedupeKey");

-- AddForeignKey
ALTER TABLE "MetaEvents" ADD CONSTRAINT "MetaEvents_igUserId_fkey" FOREIGN KEY ("igUserId") REFERENCES "InstaAccount"("igUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaEvents" ADD CONSTRAINT "MetaEvents_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
