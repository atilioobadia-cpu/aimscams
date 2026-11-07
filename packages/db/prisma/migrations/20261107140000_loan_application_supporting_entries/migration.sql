ALTER TABLE "loan_application"
  ADD COLUMN IF NOT EXISTS "guarantorEntries" JSONB,
  ADD COLUMN IF NOT EXISTS "collateralEntries" JSONB;
