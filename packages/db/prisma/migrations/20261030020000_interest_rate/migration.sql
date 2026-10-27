CREATE TYPE "InterestRateStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "interest_rate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "InterestRateStatus" NOT NULL DEFAULT 'ACTIVE',
    "rateBp" INTEGER NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'ANNUAL',
    "effectiveFrom" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interest_rate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "interest_rate_organisationId_code_key" ON "interest_rate"("organisationId", "code");
CREATE INDEX "interest_rate_organisationId_status_idx" ON "interest_rate"("organisationId", "status");

ALTER TABLE "interest_rate"
    ADD CONSTRAINT "interest_rate_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;