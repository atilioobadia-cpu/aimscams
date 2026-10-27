-- A closed day stores zero minutes. The original close-time check required a
-- positive minute even when `isClosed` was true, so relax it for closed rows.

ALTER TABLE "branch_hour" DROP CONSTRAINT "branch_hour_closes_check";

ALTER TABLE "branch_hour"
  ADD CONSTRAINT "branch_hour_closes_check"
  CHECK (
    ("isClosed" AND "closesMinute" >= 0 AND "closesMinute" <= 1440)
    OR (NOT "isClosed" AND "closesMinute" > 0 AND "closesMinute" <= 1440)
  );
