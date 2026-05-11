-- CreateTable
CREATE TABLE "InstaUser" (
    "userId" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "InstaUser_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "InstaOauth" (
    "userId" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "expires_in" INTEGER NOT NULL,

    CONSTRAINT "InstaOauth_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstaUser_igUserId_key" ON "InstaUser"("igUserId");

-- AddForeignKey
ALTER TABLE "InstaUser" ADD CONSTRAINT "InstaUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstaOauth" ADD CONSTRAINT "InstaOauth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
