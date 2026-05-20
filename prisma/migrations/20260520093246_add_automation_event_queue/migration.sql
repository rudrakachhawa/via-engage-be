-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('COMMENT', 'DM', 'LIVE_COMMENT', 'STORY_REPLY', 'MENTION');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('POST', 'REEL', 'STORY');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PROCESSING', 'DM_SENT', 'COMMENT_REPLIED', 'FAILED', 'EXPIRED');

-- AlterTable
ALTER TABLE "InstaOauth" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "triggerType" "TriggerType" NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "targetContentId" TEXT,
    "targetContentType" "ContentType",
    "targetContentUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventQueue" (
    "id" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "triggerType" "TriggerType" NOT NULL,
    "recipientIgId" TEXT NOT NULL,
    "commentId" TEXT,
    "mediaId" TEXT,
    "rawPayload" JSONB NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "triggeredAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptedAt" TIMESTAMP(3),
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Automation_igUserId_triggerType_targetContentId_key" ON "Automation"("igUserId", "triggerType", "targetContentId");

-- CreateIndex
CREATE INDEX "EventQueue_status_priority_triggeredAt_idx" ON "EventQueue"("status", "priority", "triggeredAt");

-- CreateIndex
CREATE INDEX "EventQueue_igUserId_status_idx" ON "EventQueue"("igUserId", "status");

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_igUserId_fkey" FOREIGN KEY ("igUserId") REFERENCES "InstaUser"("igUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQueue" ADD CONSTRAINT "EventQueue_igUserId_fkey" FOREIGN KEY ("igUserId") REFERENCES "InstaUser"("igUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQueue" ADD CONSTRAINT "EventQueue_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
