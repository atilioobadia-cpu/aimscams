# Phase 4 — fix plan

Ordered by impact and dependency. Each item is one commit unless noted. Nothing here
is implemented yet; Phase 5 starts at item 1.

Decisions recorded before implementation (see `DECISIONS.md`):

- **D-033** — page titles render at 20px (`--fs-title`); every other text node stays 12.8px.
- **D-034** — pagination applies to list screens only; financial statements and the chart
  of accounts render the whole result.

## Shared defects (unblock many screens, do first)

1. **Placeholder titles.** The shared `In build` component renders the raw slug or a
   lower-case fragment (`client ClientListReport`, `loan ActiveLoanReport`, `msp MSP01Report`,
   `notes of account`, `reconcile statement`). Fix once in the shared component by mapping
   the slug to a human title (or deriving it from the route segment). 68 screens affected.
   Files: `apps/web/src/components/coming-soon.tsx` (or equivalent), `apps/web/src/app/**/page.tsx`
   placeholders. Verify: all 68 placeholder titles are sentence case and human readable.

2. **Title type size.** Apply D-033: `--fs-title: 20px` (already in the token), weight 700,
   colour `--text-heading`, line-height 24px, used only by `PageHeader`. Audit every page
   that renders an `h1` outside `PageHeader`. Files: `apps/web/src/components/page-header.tsx`,
   `apps/web/src/app/globals.css`. Verify: measured `h1` fontSize = 20px on 5 sample pages at
   both widths, zero console errors.

3. **RowActionsMenu rollout.** 7 implemented screens are missing an `Actions` column where the
   reference has one. Add the shared three-dot menu with activate/deactivate where a status
   exists. Files: `apps/web/src/components/row-actions-menu.tsx` plus the 7 list pages.
   Verify: each menu opens, closes on outside click, has the right items.

## Data model (unblocks the chart of accounts and posting)

4. **Chart of accounts: groups, parent, balances.** The reference chart is grouped (`Assets`,
   `Liabilities and Owners Equity`, `Capital Account`, `Incomes`, `Expenses`) with an opening
   and closing balance per group, a date range, `Add Groups` and `Add Ledgers`, and a warning
   when opening balances do not net to zero. Ours is a flat 18-row list. Phase 1 found 115
   missing accounts (seed has 18 vs 137 reference). Work:
   - Add `parent_id`, `is_group`, `opening_balance_minor` to `Account` (migration).
   - Seed the 137-account reference chart via an idempotent seeder (`packages/ledger/src/seed.ts`
     or a new migration seed), re-runnable, never overwriting posted balances.
   - Back up the DB before running the seeder (hard rule).
   - Expose groups and balances in `getChartOfAccounts` (API).
   - Render grouped rows with opening/closing balance, date range, `Add group`/`Add ledger`,
     and the out-of-balance warning.
   Files: `packages/db/prisma/schema.prisma`, `packages/ledger/src/seed.ts`,
   `apps/api/src/accounting/accounting.service.ts`, `apps/web/src/app/(app)/accounting/chart-of-accounts/page.tsx`.
   Verify: 137 accounts, groups expand/collapse, balances reconcile (sum of group closing
   balances = 0 for a fresh seed).

5. **Posting-policy remap.** Renamed account codes (Phase 1) must be remapped in posting
   policies so no policy references a code that no longer exists. Add a migration that
   updates `posting_policy` rows by old→new code and fails loudly on an unknown code.

## List screens (actions, search, pagination)

6. **Add the missing primary add action** on 16 implemented screens where the reference has
   `Add`. Audit each: some are genuinely missing (create routes exist), some are on a
   different tab. Files: per-screen `page.tsx`.

7. **Add search/filter** on 23 implemented screens where the reference has `Search`. Use the
   shared search input with debounce; persist the query in the URL.

8. **Pagination.** Apply D-034: pager on list screens, none on statements/COA. The 4 flagged
   unpaged screens are cleared by D-034; add pagers to any list screen over 10 rows that
   lacks one.

## Report families (53 placeholders)

9. **Report hub pages.** Already implemented as hubs with icon + title + "Open". Verify each
   hub lists exactly the reports in `docs/06-regulatory-reporting.md` and links resolve.

10. **Implement the 53 report pages.** Each report is a filter bar (date range, branch,
    product) plus a table or statement, an export (CSV/PDF) and a print action. Group by
    family: loan reports, transaction reports, accounting reports, MSP01–MSP11 returns.
    The MSP returns follow `docs/06-regulatory-reporting.md` exactly. Each report page
    commits separately so regressions are isolated. Order: accounting reports first (they
    unblock reconciliation), then loan, then transaction, then MSP returns.

## Settings and message pages

11. **Send message composer.** Replace the free-text form with `Type`, `Company`, `Template`
    and `Segment` selectors, plus `Send message`, `Cancel` and `Test message`. Templates and
    segments already exist as settings; wire them in. Files:
    `apps/web/src/app/(app)/messages/send-message/page.tsx` (or component).

12. **Credit product policy detail.** Replace the `<pre>` JSON dump with eight tabs:
    `Terms`, `Settings`, `Interest`, `Repayments`, `Guarantors and Collateral`, `Loan charges`,
    `Loan stages`, `Accounting setting`. Render minimum/maximum amount, tenure, grace period,
    approval stage and status from the policy's structured fields; fall back to a JSON tab
    for unknown fields. Files: `apps/web/src/components/settings/credit-product-policy-detail.tsx`.

13. **Holiday calendar + working days.** Add a working-days policy (which weekdays are working
    days) alongside the holiday list, because due-date calculation reads it. Files:
    `apps/web/src/app/(app)/settings/policies/holidays/page.tsx`, API settings.

14. **Client groups.** Add a group detail route (currently only a create form exists). Files:
    new `apps/web/src/app/(app)/clients/groups/[id]/page.tsx`, API client-group endpoints.

## Loan detail tabs

15. **Loan detail: schedule, charges, headers on empty tabs.** The reference keeps
    `Summary`, `Transactions`, `Schedule`, `Repayments`, `Charges`, `Guarantors`, `Documents`,
    `History` as tabs and renders column headers above `No data available`. Ours splits
    them into routes, omits schedule and charges, and shows a bare empty state. Add the
    missing tabs and render headers on empty tables. Files: `apps/web/src/app/(app)/account-loan-details/[id]/**`.

## Import pages

16. **Import batch tables.** Add the 10-column batch list (`Id`, `File`, `Batch reference id`,
    `Date`, `Template`, `Type`, `Status`, `Total records`, `Uploaded records`, `Uploaded by`)
    plus search and filters, around the existing empty state. Files:
    `apps/web/src/app/(app)/import-*/page.tsx`.

## Teller and requests

17. **Teller approval queue.** Replace the ID-paste form with a queue listing `Date`,
    `Request`, `Status`, `Requester`, `Current assignee`, `Approved by` and a row menu.
    Files: `apps/web/src/app/(app)/transaction/teller-transaction-request/page.tsx`, API.

## Verification gate (every item)

- Typecheck: `npm run typecheck` (all workspaces).
- Tests: `npm test`.
- Build: `npm run build` (web + api).
- Browser: Playwright at 1280×800 and 1837×1080, zero console errors/warnings, no horizontal
  overflow, measured values recorded.
- Commit one change per item, review own diff, push to `origin/main`.

## Deferred (recorded decisions)

- ST-28 (Service providers) deferred by D-015.
- WB-01 (Business account) dropped pending commercial decision.
- Chart-of-accounts tree detail lands with Accounting (D-029); Phase 5 item 4 ships the
  grouped list only.
