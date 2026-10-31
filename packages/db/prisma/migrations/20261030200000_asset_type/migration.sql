CREATE TABLE "asset_type" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" uuid NOT NULL REFERENCES "organisation"("id") ON DELETE CASCADE,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "depreciationMethod" text NOT NULL DEFAULT 'STRAIGHT_LINE',
  "usefulLifeMonths" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'ACTIVE',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("organisationId", "code")
);
CREATE INDEX "asset_type_organisationId_status_idx" ON "asset_type" ("organisationId", "status");
