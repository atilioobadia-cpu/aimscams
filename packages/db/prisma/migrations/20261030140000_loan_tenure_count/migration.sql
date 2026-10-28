-- `tenureMonths` only held a month count while `tenurePeriod` could be days or weeks,
-- so the column name described the wrong thing. The pair is a count plus its unit.
ALTER TABLE "loan_application" RENAME COLUMN "tenureMonths" TO "tenureCount";
