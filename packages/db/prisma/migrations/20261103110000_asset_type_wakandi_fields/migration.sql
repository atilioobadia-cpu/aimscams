ALTER TABLE "asset_type"
  ADD COLUMN "ledgerAccountId" text,
  ADD COLUMN "depreciationLedgerAccountId" text,
  ADD COLUMN "residualValueMinor" bigint,
  ADD COLUMN "rate" decimal(8, 4);
