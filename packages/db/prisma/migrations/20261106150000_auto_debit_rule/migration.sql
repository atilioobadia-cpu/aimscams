CREATE TYPE "AutoDebitRuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "auto_debit_rule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sourceProduct" TEXT NOT NULL,
    "triggerEvents" TEXT[] NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "requiresConsent" BOOLEAN NOT NULL DEFAULT true,
    "overridable" BOOLEAN NOT NULL DEFAULT false,
    "status" "AutoDebitRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_debit_rule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auto_debit_rule_organisationId_code_key" ON "auto_debit_rule"("organisationId", "code");
CREATE INDEX "auto_debit_rule_organisationId_status_idx" ON "auto_debit_rule"("organisationId", "status");

ALTER TABLE "auto_debit_rule" ADD CONSTRAINT "auto_debit_rule_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
