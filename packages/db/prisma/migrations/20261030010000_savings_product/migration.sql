CREATE TYPE "SavingsProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

CREATE TABLE "savings_product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SavingsProductStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "allowedAsGuarantor" BOOLEAN NOT NULL DEFAULT false,
    "allowedAsCollateral" BOOLEAN NOT NULL DEFAULT false,
    "allowedMultipleAccounts" BOOLEAN NOT NULL DEFAULT false,
    "allowInterestPayout" BOOLEAN NOT NULL DEFAULT false,
    "minBalanceMinor" BIGINT NOT NULL DEFAULT 0,
    "interestRateBp" INTEGER NOT NULL DEFAULT 0,
    "interestPayoutFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_product_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "savings_product_organisationId_code_key" ON "savings_product"("organisationId", "code");
CREATE INDEX "savings_product_organisationId_status_idx" ON "savings_product"("organisationId", "status");

ALTER TABLE "savings_product"
    ADD CONSTRAINT "savings_product_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;