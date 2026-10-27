-- Phase 4a: organisation identity and the branch network.
--
-- Hand-written because `prisma migrate diff` also wants to drop the ledger tables:
-- those are owned by packages/ledger/src/schema.sql, not the Prisma schema.

ALTER TABLE "organisation"
  ADD COLUMN "registrationNo" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "logoMime" TEXT,
  ADD COLUMN "logoData" BYTEA,
  ADD COLUMN "logoUpdatedAt" TIMESTAMP(3);

ALTER TABLE "branch"
  ADD COLUMN "addressLine" TEXT,
  ADD COLUMN "ward" TEXT,
  ADD COLUMN "employeeCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "branch"
  ADD CONSTRAINT "branch_employee_count_check" CHECK ("employeeCount" >= 0);

-- One default branch per institution, enforced by the database as well as the service.
CREATE UNIQUE INDEX "branch_one_default_per_organisation"
  ON "branch" ("organisationId")
  WHERE "isDefault";

CREATE TABLE "branch_hour" (
  "id" UUID NOT NULL,
  "branchId" UUID NOT NULL,
  "weekday" INTEGER NOT NULL,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "opensMinute" INTEGER NOT NULL DEFAULT 0,
  "closesMinute" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "branch_hour_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "branch_hour_weekday_check" CHECK ("weekday" BETWEEN 1 AND 7),
  CONSTRAINT "branch_hour_opens_check" CHECK ("opensMinute" >= 0 AND "opensMinute" < 1440),
  CONSTRAINT "branch_hour_closes_check" CHECK ("closesMinute" > 0 AND "closesMinute" <= 1440),
  CONSTRAINT "branch_hour_range_check"
    CHECK ("isClosed" OR "closesMinute" > "opensMinute")
);

CREATE INDEX "branch_hour_branchId_idx" ON "branch_hour" ("branchId");

CREATE UNIQUE INDEX "branch_hour_branchId_weekday_key"
  ON "branch_hour" ("branchId", "weekday");

ALTER TABLE "branch_hour"
  ADD CONSTRAINT "branch_hour_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "branch" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
