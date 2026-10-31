CREATE TABLE "import_batch" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" uuid NOT NULL REFERENCES "organisation"("id") ON DELETE CASCADE,
  "branchId" uuid REFERENCES "branch"("id") ON DELETE SET NULL,
  "reference" text NOT NULL,
  "kind" text NOT NULL,
  "fileName" text NOT NULL,
  "fileHash" text,
  "status" text NOT NULL DEFAULT 'UPLOADED',
  "totalRows" integer NOT NULL DEFAULT 0,
  "successRows" integer NOT NULL DEFAULT 0,
  "failedRows" integer NOT NULL DEFAULT 0,
  "errorFileUrl" text,
  "uploadedByUserId" uuid,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "completedAt" timestamp,
  UNIQUE ("organisationId", "reference")
);
CREATE INDEX "import_batch_organisationId_kind_idx" ON "import_batch" ("organisationId", "kind");
