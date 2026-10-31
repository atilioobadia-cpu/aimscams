CREATE TABLE "fixed_asset" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" uuid NOT NULL REFERENCES "organisation"("id") ON DELETE CASCADE,
  "branchId" uuid REFERENCES "branch"("id") ON DELETE SET NULL,
  "assetTypeId" uuid REFERENCES "asset_type"("id") ON DELETE SET NULL,
  "assetNo" text NOT NULL,
  "description" text NOT NULL,
  "acquisitionDate" date NOT NULL,
  "acquisitionCostMinor" bigint NOT NULL,
  "accumulatedDepreciationMinor" bigint NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'ACTIVE',
  "disposalDate" date,
  "disposalProceedsMinor" bigint,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("organisationId", "assetNo")
);
CREATE INDEX "fixed_asset_organisationId_status_idx" ON "fixed_asset" ("organisationId", "status");
