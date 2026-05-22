/*
  Warnings:

  - You are about to drop the `InstaOauth` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InstaUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Automation" DROP CONSTRAINT "Automation_igUserId_fkey";

-- DropForeignKey
ALTER TABLE "EventQueue" DROP CONSTRAINT "EventQueue_igUserId_fkey";

-- DropForeignKey
ALTER TABLE "InstaOauth" DROP CONSTRAINT "InstaOauth_userId_fkey";

-- DropForeignKey
ALTER TABLE "InstaUser" DROP CONSTRAINT "InstaUser_userId_fkey";

-- DropTable
DROP TABLE "InstaOauth";

-- DropTable
DROP TABLE "InstaUser";

-- CreateTable
CREATE TABLE "InstaAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,

    CONSTRAINT "InstaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstaAccountOauth" (
    "userId" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "expires_in" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "InstaAccountOauth_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstaAccount_igUserId_key" ON "InstaAccount"("igUserId");

-- AddForeignKey
ALTER TABLE "InstaAccount" ADD CONSTRAINT "InstaAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstaAccountOauth" ADD CONSTRAINT "InstaAccountOauth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_igUserId_fkey" FOREIGN KEY ("igUserId") REFERENCES "InstaAccount"("igUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQueue" ADD CONSTRAINT "EventQueue_igUserId_fkey" FOREIGN KEY ("igUserId") REFERENCES "InstaAccount"("igUserId") ON DELETE CASCADE ON UPDATE CASCADE;
