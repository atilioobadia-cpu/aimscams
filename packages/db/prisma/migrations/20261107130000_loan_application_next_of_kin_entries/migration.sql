ALTER TABLE "loan_application"
  ADD COLUMN IF NOT EXISTS "nextOfKinEntries" JSONB;
