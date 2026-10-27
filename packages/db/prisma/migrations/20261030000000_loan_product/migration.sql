CREATE TYPE "LoanProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

CREATE TABLE "loan_product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "LoanProductStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "minPrincipalMinor" BIGINT NOT NULL,
    "maxPrincipalMinor" BIGINT NOT NULL,
    "minTenureMonths" INTEGER NOT NULL,
    "maxTenureMonths" INTEGER NOT NULL,
    "interestRateBp" INTEGER NOT NULL,
    "interestMethod" TEXT NOT NULL,
    "repaymentFrequency" TEXT NOT NULL,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "arrearsClassificationDays" INTEGER NOT NULL DEFAULT 30,
    "managementFeeBp" INTEGER NOT NULL DEFAULT 0,
    "penaltyBp" INTEGER NOT NULL DEFAULT 0,
    "principalAccountId" TEXT,
    "interestIncomeAccountId" TEXT,
    "chargesIncomeAccountId" TEXT,
    "penaltyIncomeAccountId" TEXT,
    "workflowStages" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_product_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "loan_product_organisationId_code_key" ON "loan_product"("organisationId", "code");
CREATE INDEX "loan_product_organisationId_status_idx" ON "loan_product"("organisationId", "status");

ALTER TABLE "loan_product"
    ADD CONSTRAINT "loan_product_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;