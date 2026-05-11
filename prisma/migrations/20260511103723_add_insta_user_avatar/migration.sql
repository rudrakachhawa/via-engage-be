/*
  Warnings:

  - Added the required column `avatar` to the `InstaUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InstaUser" ADD COLUMN     "avatar" TEXT NOT NULL;
