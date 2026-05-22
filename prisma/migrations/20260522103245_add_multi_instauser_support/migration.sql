/*
  Warnings:

  - The primary key for the `InstaUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `igUserId` on the `User` table. All the data in the column will be lost.
  - The required column `id` was added to the `InstaUser` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "User_igUserId_key";

-- AlterTable
ALTER TABLE "InstaUser" DROP CONSTRAINT "InstaUser_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "InstaUser_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "igUserId";
