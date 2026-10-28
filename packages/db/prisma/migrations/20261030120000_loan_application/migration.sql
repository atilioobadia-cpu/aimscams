CREATE TYPE "LoanApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "loan_application" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "branchId" UUID,
    "clientId" UUID NOT NULL,
    "productId" UUID,
    "applicationNo" TEXT NOT NULL,
    "status" "LoanApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "principalMinor" BIGINT NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "interestRateBp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_application_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "loan_application_organisationId_applicationNo_key" ON "loan_application"("organisationId", "applicationNo");
CREATE INDEX "loan_application_organisationId_status_idx" ON "loan_application"("organisationId", "status");

ALTER TABLE "loan_application"
    ADD CONSTRAINT "loan_application_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loan_application"
    ADD CONSTRAINT "loan_application_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "branch"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "loan_application"
    ADD CONSTRAINT "loan_application_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "client"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loan_application"
    ADD CONSTRAINT "loan_application_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "loan_product"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;