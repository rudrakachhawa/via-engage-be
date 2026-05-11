-- Rename User.instaUserId -> User.igUserId
ALTER TABLE "User" RENAME COLUMN "instaUserId" TO "igUserId";

-- Keep Prisma's conventional unique index name aligned with the new field
DROP INDEX IF EXISTS "User_instaUserId_key";
CREATE UNIQUE INDEX "User_igUserId_key" ON "User"("igUserId");
