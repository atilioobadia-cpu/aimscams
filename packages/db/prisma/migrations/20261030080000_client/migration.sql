CREATE TYPE "ClientType" AS ENUM ('INDIVIDUAL', 'GROUP');
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

CREATE TABLE "client" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "branchId" UUID,
    "membershipPolicyId" UUID,
    "clientType" "ClientType" NOT NULL DEFAULT 'INDIVIDUAL',
    "referenceNo" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "nationalId" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_organisationId_referenceNo_key" ON "client"("organisationId", "referenceNo");
CREATE INDEX "client_organisationId_status_idx" ON "client"("organisationId", "status");
CREATE INDEX "client_organisationId_clientType_idx" ON "client"("organisationId", "clientType");

ALTER TABLE "client"
    ADD CONSTRAINT "client_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client"
    ADD CONSTRAINT "client_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "branch"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;