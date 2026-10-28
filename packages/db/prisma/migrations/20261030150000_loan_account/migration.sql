-- Loan account + schedule (Phase 6c).

CREATE TYPE "LoanStatus" AS ENUM (
  'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DISBURSED', 'ACTIVE',
  'DELINQUENT', 'NPA', 'RESCHEDULED', 'CLOSED', 'WRITTEN_OFF', 'REJECTED'
);

CREATE TABLE "loan" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" uuid NOT NULL REFERENCES "organisation"("id") ON DELETE CASCADE,
  "branchId" uuid REFERENCES "branch"("id") ON DELETE SET NULL,
  "clientId" uuid NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
  "productId" uuid REFERENCES "loan_product"("id") ON DELETE SET NULL,
  "applicationId" uuid UNIQUE REFERENCES "loan_application"("id") ON DELETE SET NULL,
  "loanNumber" text NOT NULL,
  "status" "LoanStatus" NOT NULL DEFAULT 'APPROVED',
  "principalMinor" bigint NOT NULL,
  "outstandingPrincipalMinor" bigint NOT NULL DEFAULT 0,
  "tenureCount" int NOT NULL,
  "tenurePeriod" "LoanTenurePeriod" NOT NULL DEFAULT 'MONTHS',
  "interestRateBp" int NOT NULL,
  "interestMethod" "LoanInterestMethod" NOT NULL DEFAULT 'REDUCING_BALANCE_EQUAL_INSTALLMENT',
  "installmentStartDate" date,
  "policyVersionId" uuid,
  "isInsider" boolean NOT NULL DEFAULT false,
  "classification" text DEFAULT 'Performing',
  "daysPastDue" int NOT NULL DEFAULT 0,
  "disbursedAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("organisationId", "loanNumber")
);
CREATE INDEX "loan_organisationId_status_idx" ON "loan" ("organisationId", "status");
CREATE INDEX "loan_clientId_idx" ON "loan" ("clientId");

CREATE TABLE "loan_schedule" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" uuid NOT NULL REFERENCES "organisation"("id") ON DELETE CASCADE,
  "loanId" uuid NOT NULL REFERENCES "loan"("id") ON DELETE CASCADE,
  "installmentNo" int NOT NULL,
  "dueDate" date NOT NULL,
  "openingPrincipalMinor" bigint NOT NULL,
  "principalMinor" bigint NOT NULL,
  "interestMinor" bigint NOT NULL,
  "totalMinor" bigint NOT NULL,
  "closingPrincipalMinor" bigint NOT NULL,
  "status" text NOT NULL DEFAULT 'SCHEDULED',
  "paidAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("loanId", "installmentNo")
);
CREATE INDEX "loan_schedule_loanId_idx" ON "loan_schedule" ("loanId");
CREATE INDEX "loan_schedule_organisationId_idx" ON "loan_schedule" ("organisationId");
