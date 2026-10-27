CREATE TYPE "ProvisioningRuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "provisioning_rule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProvisioningRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "daysFrom" INTEGER NOT NULL,
    "daysTo" INTEGER,
    "rateBp" INTEGER NOT NULL,
    "glAccountId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provisioning_rule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "provisioning_rule_organisationId_code_key" ON "provisioning_rule"("organisationId", "code");
CREATE INDEX "provisioning_rule_organisationId_status_idx" ON "provisioning_rule"("organisationId", "status");

ALTER TABLE "provisioning_rule"
    ADD CONSTRAINT "provisioning_rule_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;