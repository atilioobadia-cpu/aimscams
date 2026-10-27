CREATE TYPE "CreditProductPolicyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

CREATE TABLE "credit_product_policy" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CreditProductPolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_product_policy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "credit_product_policy_organisationId_code_key" ON "credit_product_policy"("organisationId", "code");
CREATE INDEX "credit_product_policy_organisationId_status_idx" ON "credit_product_policy"("organisationId", "status");

ALTER TABLE "credit_product_policy"
    ADD CONSTRAINT "credit_product_policy_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;