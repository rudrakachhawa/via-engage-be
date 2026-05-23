/*
  Warnings:

  - You are about to drop the `AutomationReply` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AutomationReply" DROP CONSTRAINT "AutomationReply_automationId_fkey";

-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "commentReplies" TEXT[] DEFAULT ARRAY['Check your DM']::TEXT[];

-- DropTable
DROP TABLE "AutomationReply";
