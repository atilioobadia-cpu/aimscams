CREATE TYPE "SavingsAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');

CREATE TABLE "savings_account" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "branchId" UUID,
    "clientId" UUID NOT NULL,
    "productId" UUID,
    "accountNumber" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'PRIMARY',
    "status" "SavingsAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "balanceMinor" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "savings_account_organisationId_accountNumber_key" ON "savings_account"("organisationId", "accountNumber");
CREATE INDEX "savings_account_organisationId_status_idx" ON "savings_account"("organisationId", "status");

ALTER TABLE "savings_account"
    ADD CONSTRAINT "savings_account_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "savings_account"
    ADD CONSTRAINT "savings_account_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "branch"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "savings_account"
    ADD CONSTRAINT "savings_account_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "client"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "savings_account"
    ADD CONSTRAINT "savings_account_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "savings_product"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;