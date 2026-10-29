CREATE TABLE "request" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" uuid NOT NULL REFERENCES "organisation"("id") ON DELETE CASCADE,
  "branchId" uuid REFERENCES "branch"("id") ON DELETE SET NULL,
  "requestNo" text NOT NULL,
  "requestType" text NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}',
  "amountMinor" bigint,
  "status" text NOT NULL DEFAULT 'PENDING',
  "currentAssigneeId" uuid,
  "requestedByUserId" uuid,
  "approvedByUserId" uuid,
  "approvedAt" timestamp,
  "reason" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("organisationId", "requestNo")
);
CREATE INDEX "request_organisationId_status_idx" ON "request" ("organisationId", "status");
CREATE INDEX "request_organisationId_requestType_idx" ON "request" ("organisationId", "requestType");
