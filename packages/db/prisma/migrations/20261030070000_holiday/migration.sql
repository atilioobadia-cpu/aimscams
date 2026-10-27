CREATE TABLE "holiday" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisationId" UUID NOT NULL,
    "branchId" UUID,
    "name" TEXT NOT NULL,
    "holidayDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holiday_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "holiday_organisationId_holidayDate_idx" ON "holiday"("organisationId", "holidayDate");

ALTER TABLE "holiday"
    ADD CONSTRAINT "holiday_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "holiday"
    ADD CONSTRAINT "holiday_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "branch"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;