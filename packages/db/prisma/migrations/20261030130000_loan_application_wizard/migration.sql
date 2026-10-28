CREATE TYPE "LoanTenurePeriod" AS ENUM ('DAYS', 'WEEKS', 'MONTHS');
CREATE TYPE "LoanInterestMethod" AS ENUM ('REDUCING_BALANCE_EQUAL_INSTALLMENT', 'REDUCING_BALANCE_EQUAL_PRINCIPAL', 'FLAT_RATE');
CREATE TYPE "PaymentDestination" AS ENUM ('BANK', 'MNO', 'CASH');
CREATE TYPE "LoanDocumentKind" AS ENUM ('NATIONAL_ID', 'PAYSLIP', 'BANK_STATEMENT', 'BUSINESS_LICENSE', 'COLLATERAL', 'OTHER');

ALTER TABLE "loan_application"
    ADD COLUMN "loanOfficerId" UUID,
    ADD COLUMN "tenurePeriod" "LoanTenurePeriod" NOT NULL DEFAULT 'MONTHS',
    ADD COLUMN "gracePeriodMonths" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "interestMethod" "LoanInterestMethod" NOT NULL DEFAULT 'REDUCING_BALANCE_EQUAL_INSTALLMENT',
    ADD COLUMN "interestOnGrace" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "installmentStartDate" DATE,
    ADD COLUMN "debtCapacityMinor" BIGINT,
    ADD COLUMN "economicSector" TEXT,
    ADD COLUMN "subEconomicSector" TEXT,
    ADD COLUMN "subSubEconomicSector" TEXT,
    ADD COLUMN "description" TEXT,
    ADD COLUMN "purpose" TEXT,
    ADD COLUMN "hasGuarantor" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "hasCollateral" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "disbursementPreference" TEXT,
    ADD COLUMN "remarks" TEXT,
    ADD COLUMN "nomineeName" TEXT,
    ADD COLUMN "nomineeRelation" TEXT,
    ADD COLUMN "nomineePhone" TEXT,
    ADD COLUMN "nomineeIdNumber" TEXT,
    ADD COLUMN "nomineePercentage" INTEGER,
    ADD COLUMN "paymentDestination" "PaymentDestination",
    ADD COLUMN "bankName" TEXT,
    ADD COLUMN "bankAccountName" TEXT,
    ADD COLUMN "bankAccountNumber" TEXT,
    ADD COLUMN "mnoProvider" TEXT,
    ADD COLUMN "mnoWalletNumber" TEXT,
    ADD COLUMN "submittedAt" TIMESTAMP(3);

CREATE INDEX "loan_application_loanOfficerId_idx" ON "loan_application"("loanOfficerId");

ALTER TABLE "loan_application"
    ADD CONSTRAINT "loan_application_loanOfficerId_fkey"
    FOREIGN KEY ("loanOfficerId") REFERENCES "app_user"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "loan_application_document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "loanApplicationId" UUID NOT NULL,
    "kind" "LoanDocumentKind" NOT NULL DEFAULT 'OTHER',
    "name" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "uploadedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_application_document_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "loan_application_document_loanApplicationId_idx" ON "loan_application_document"("loanApplicationId");
CREATE INDEX "loan_application_document_organisationId_idx" ON "loan_application_document"("organisationId");

ALTER TABLE "loan_application_document"
    ADD CONSTRAINT "loan_application_document_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loan_application_document"
    ADD CONSTRAINT "loan_application_document_loanApplicationId_fkey"
    FOREIGN KEY ("loanApplicationId") REFERENCES "loan_application"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
