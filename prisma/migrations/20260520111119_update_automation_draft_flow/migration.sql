-- DropIndex
DROP INDEX "Automation_igUserId_triggerType_targetContentId_key";

-- AlterTable
ALTER TABLE "Automation" ALTER COLUMN "isActive" SET DEFAULT false;
