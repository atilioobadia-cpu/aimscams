-- Use the reference-style 14-digit range for newly generated journal entries.
-- Existing posted entry numbers remain unchanged.
ALTER TABLE "journal_entry"
  ALTER COLUMN "entry_no" RESTART WITH 31953200001088;
