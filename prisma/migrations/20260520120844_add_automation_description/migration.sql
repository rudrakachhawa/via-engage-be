/*
  Warnings:

  - You are about to drop the column `messageTemplate` on the `Automation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Automation" DROP COLUMN "messageTemplate",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "AutomationReply" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationReply_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AutomationReply" ADD CONSTRAINT "AutomationReply_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
