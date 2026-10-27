CREATE TYPE "FeePenaltyKind" AS ENUM ('FEE', 'PENALTY');
CREATE TYPE "FeeAmountType" AS ENUM ('FIXED', 'PERCENTAGE');
CREATE TYPE "FeePenaltyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "fee_penalty" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "FeePenaltyKind" NOT NULL,
    "amountType" "FeeAmountType" NOT NULL,
    "amountMinor" BIGINT,
    "rateBp" INTEGER,
    "glAccountId" TEXT,
    "status" "FeePenaltyStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_penalty_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fee_penalty_organisationId_code_key" ON "fee_penalty"("organisationId", "code");
CREATE INDEX "fee_penalty_organisationId_status_idx" ON "fee_penalty"("organisationId", "status");

ALTER TABLE "fee_penalty"
    ADD CONSTRAINT "fee_penalty_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;