# Round 4 Dashboard parity baseline

## Scope

Added tests/e2e/dashboard-parity.spec.ts before changing dashboard or shared UI source. It contains one grouped assertion test for each of the eleven numbered visual requirements, using the supplied 1817px screenshot measurements calibrated at 1.5 screenshot pixels per CSS pixel.

## Baseline run

Command:

    node tools/ui-audit/node_modules/playwright/cli.js test tests/e2e/dashboard-parity.spec.ts --workers=1 --reporter=line

Result: **11 failed before any parity assertion ran; 0 assertions evaluated.**

All eleven tests fail at the same beforeEach gate: Playwright navigates to /dashboard, but artifacts/storage-state.json redirects to the local AIMSCAMS Login page. The expected dashboard-tab-card is absent. The captured error context confirms the Login heading, Email and Password fields, Forgot password link, and Login button. This is a local test-authentication setup blocker, not a dashboard parity result.

No credentials or browser cookies were read or copied. No dashboard, shared-shell, seed, or production data was changed for this baseline. Refresh the local Playwright storage state through an authorized local login before treating the parity assertions as evaluated.

## Grouped test coverage

1. Page shell and header.
2. Dashboard tabs.
3. KPI cards.
4. Shared chart rendering and card styles.
5. Funds In vs Funds Out.
6. Savings, Shares & Loans.
7. PAR buckets.
8. Chart hover tooltips.
9. Amount formatting and ledger-backed series.
10. Bottom white strip.
11. Sidebar geometry, groups, icons, scroll, active item, and footer.

