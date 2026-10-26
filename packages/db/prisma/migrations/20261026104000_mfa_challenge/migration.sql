-- AlterTable
ALTER TABLE "mfa_secret" ADD COLUMN     "lastUsedCounter" INTEGER;

-- CreateTable
CREATE TABLE "mfa_challenge" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mfa_challenge_tokenHash_key" ON "mfa_challenge"("tokenHash");

-- CreateIndex
CREATE INDEX "mfa_challenge_userId_expiresAt_idx" ON "mfa_challenge"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "mfa_challenge" ADD CONSTRAINT "mfa_challenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
