-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "convertToFollower" BOOLEAN DEFAULT false,
ADD COLUMN     "convertToFollowerMessage" JSONB;
