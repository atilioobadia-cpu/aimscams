ALTER TABLE "loan_product"
  ADD COLUMN IF NOT EXISTS "accruedAccountId" TEXT,
  ADD COLUMN IF NOT EXISTS "expenseAccountId" TEXT,
  ADD COLUMN IF NOT EXISTS "overpaymentAccountId" TEXT,
  ADD COLUMN IF NOT EXISTS "suspenseAccountId" TEXT;
