CREATE TABLE "message_template" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" uuid NOT NULL REFERENCES "organisation"("id") ON DELETE CASCADE,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "channel" text NOT NULL DEFAULT 'SMS',
  "language" text NOT NULL DEFAULT 'en',
  "subject" text,
  "body" text NOT NULL,
  "status" text NOT NULL DEFAULT 'ACTIVE',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("organisationId", "key", "language")
);
CREATE INDEX "message_template_organisationId_status_idx" ON "message_template" ("organisationId", "status");

CREATE TABLE "message_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organisationId" uuid NOT NULL REFERENCES "organisation"("id") ON DELETE CASCADE,
  "branchId" uuid REFERENCES "branch"("id") ON DELETE SET NULL,
  "templateKey" text,
  "channel" text NOT NULL DEFAULT 'SMS',
  "recipient" text NOT NULL,
  "body" text NOT NULL,
  "status" text NOT NULL DEFAULT 'QUEUED',
  "provider" text,
  "externalRef" text,
  "credits" integer NOT NULL DEFAULT 0,
  "failureReason" text,
  "sentAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "message_log_organisationId_status_idx" ON "message_log" ("organisationId", "status");
CREATE INDEX "message_log_organisationId_channel_idx" ON "message_log" ("organisationId", "channel");
