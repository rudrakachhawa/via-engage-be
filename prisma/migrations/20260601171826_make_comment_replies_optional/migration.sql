/*
  Warnings:

  - The `commentReplies` column on the `Automation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Automation" DROP COLUMN "commentReplies",
ADD COLUMN     "commentReplies" JSONB;
