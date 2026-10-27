CREATE TYPE "MembershipPolicyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

CREATE TABLE "membership_policy" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "MembershipPolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "memberType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "minNextOfKin" INTEGER NOT NULL DEFAULT 1,
    "maxNextOfKin" INTEGER NOT NULL DEFAULT 2,
    "dormantDays" INTEGER NOT NULL DEFAULT 365,
    "allowWithdraw" BOOLEAN NOT NULL DEFAULT true,
    "autoActiveUponDeposit" BOOLEAN NOT NULL DEFAULT false,
    "enableMemberVerification" BOOLEAN NOT NULL DEFAULT false,
    "verificationType" TEXT,
    "boardApproval" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_policy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "membership_policy_organisationId_code_key" ON "membership_policy"("organisationId", "code");
CREATE INDEX "membership_policy_organisationId_status_idx" ON "membership_policy"("organisationId", "status");

ALTER TABLE "membership_policy"
    ADD CONSTRAINT "membership_policy_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;