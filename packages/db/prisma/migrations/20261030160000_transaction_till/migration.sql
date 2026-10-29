CREATE TABLE "till_session" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" uuid NOT NULL REFERENCES "organisation"("id") ON DELETE CASCADE,
  "branchId" uuid REFERENCES "branch"("id") ON DELETE SET NULL,
  "tellerId" uuid NOT NULL REFERENCES "app_user"("id") ON DELETE CASCADE,
  "businessDate" date NOT NULL,
  "openingFloatMinor" bigint NOT NULL DEFAULT 0,
  "closingCountedMinor" bigint,
  "systemBalanceMinor" bigint,
  "varianceMinor" bigint,
  "status" text NOT NULL DEFAULT 'OPEN',
  "openedAt" timestamp NOT NULL DEFAULT now(),
  "closedAt" timestamp,
  UNIQUE ("tellerId", "businessDate")
);
CREATE INDEX "till_session_organisationId_status_idx" ON "till_session" ("organisationId", "status");

CREATE TABLE "transaction" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" uuid NOT NULL REFERENCES "organisation"("id") ON DELETE CASCADE,
  "branchId" uuid REFERENCES "branch"("id") ON DELETE SET NULL,
  "tillSessionId" uuid REFERENCES "till_session"("id") ON DELETE SET NULL,
  "transactionNo" text NOT NULL,
  "type" text NOT NULL,
  "category" text NOT NULL,
  "clientId" uuid REFERENCES "client"("id") ON DELETE SET NULL,
  "savingsAccountId" uuid REFERENCES "savings_account"("id") ON DELETE SET NULL,
  "loanId" uuid REFERENCES "loan"("id") ON DELETE SET NULL,
  "amountMinor" bigint NOT NULL,
  "drCr" text NOT NULL,
  "paymentMethod" text,
  "valueDate" date,
  "chequeNo" text,
  "receiptNo" text,
  "externalRef" text,
  "provider" text,
  "status" text NOT NULL DEFAULT 'SUBMITTED',
  "accountingStatus" text NOT NULL DEFAULT 'PENDING',
  "idempotencyKey" text,
  "createdByUserId" uuid,
  "approvedByUserId" uuid,
  "reversedByUserId" uuid,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("organisationId", "transactionNo")
);
CREATE INDEX "transaction_organisationId_status_idx" ON "transaction" ("organisationId", "status");
CREATE INDEX "transaction_clientId_idx" ON "transaction" ("clientId");
CREATE INDEX "transaction_loanId_idx" ON "transaction" ("loanId");
