CREATE TABLE "client_kyc_document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "comments" TEXT,
    "uploadedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_kyc_document_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "client_kyc_document_organisationId_clientId_createdAt_idx"
    ON "client_kyc_document"("organisationId", "clientId", "createdAt");

ALTER TABLE "client_kyc_document"
    ADD CONSTRAINT "client_kyc_document_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_kyc_document"
    ADD CONSTRAINT "client_kyc_document_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_kyc_document"
    ADD CONSTRAINT "client_kyc_document_uploadedByUserId_fkey"
    FOREIGN KEY ("uploadedByUserId") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
