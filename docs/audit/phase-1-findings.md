# Phase 1 findings: full system audit

Measured 2026-10-29 at commit `42b4f01` (plus the audit tooling in this phase). Browser: Chromium via Playwright, admin login, viewport 1280×800. Full per-route table: `system-audit.md`. Raw data: `route-crawl.json`, `route-crawl-dynamic.json`.

## What was tested

- Every route under `apps/web/src/app/(app)` (141 static) and every dynamic route with a real record id (15). Total 156.
- Per route: HTTP status, final URL (redirects), heading, console errors and warnings, failed API calls (4xx/5xx from `localhost:4000`), placeholder text ("In build", "Coming soon", "Under construction", "Lorem", "TODO", "Wakandi"), horizontal overflow, back control, empty state, table rows, pagination, native `<select>` count, and Radix combobox count.
- Sidebar linkage, from the `href` values in `apps/web/src/lib/nav.ts`.
- Reference COA validated and compared with the live chart (`coa-diff.md`).

## Results

| Status | Count | Meaning |
|---|---|---|
| OK | 78 | Renders real content, no console error, no failed call, no overflow |
| In build | 73 | Shared `ComingSoon` placeholder |
| Redirect | 5 | Legacy alias routes that redirect to a real page |
| Buggy | 0 | No console error, failed API call, overflow, or Wakandi text on any route |

Zero console errors across 156 routes is a measured result, but it covers the production build only, and only the browser console messages the crawl captured.

## Critical findings

1. **73 pages are placeholders.** Every one renders `ComingSoon` ("In build" badge plus "… is not enabled yet"). Breakdown: 25 loan reports, 2 statement reports, 26 other operational reports (client 2, savings 3, transaction 4, MSP 17), 10 accounting reports, and 10 other pages (business account, campaigns, import, messages and its 5 sub-pages, service providers, policies).
2. **Five sidebar entries lead to placeholders.** `/import`, `/messages`, `/campaigns`, `/business-account`, and `/settings/policies`. The Policies hub is a placeholder, yet its three children (membership, credit product, holidays) work. Users reach a dead end from a visible menu item.
3. **Loan and statement reports are all placeholders.** All 25 `/reports-loan-*` routes and both `/reports-statement-*` routes. The report hubs (`/reports`, `/reports-loan`, `/reports-statement`) are live and link to them. Operational reports (client, savings, transaction, MSP) are placeholders too, 26 in total.
4. **Accounting reports are partly placeholders.** Built (OK): cash book, cash flow, financial position, general ledger book, income statement, journal book, trial balance. Placeholder (10): Assets, comprehensive trial balance, corporate tax statement, ledger statement, monthly trial balance, owners' equity, reconciliation, notes of account, reconcile statement and its settings.
5. **Chart of accounts does not match the reference.** Live chart: 18 accounts, no parent, no group rows. Reference: 132 coded accounts, 5 top-level groups, full hierarchy. 115 reference accounts are missing, 16 existing accounts are renamed, 1 account (`2101 Member savings`) has no reference equivalent. Posting policies in `packages/ledger/src/seed.ts` depend on codes that the reference renames or drops. Details: `coa-diff.md`.

## Structural findings

6. **Placeholder page titles are raw route slugs.** Titles such as `ComprehensiveTrialBalance`, `LedgerStatementReport`, `OwnersEquity`, `notes of account`, `client ClientListReport`, and `msp MSP01Report` show a file name, not a report title. This is visible on every placeholder report and is a presentation defect.
7. **Five redundant alias routes.** `/settings` (to General), `/settings/products` (to Loan), `/settings/roles` and `/settings/users` (to `/settings-role` and `/settings-administrator`), and `/settings-administrator-add` (to `/settings-administrator`). They work, but they duplicate the real pages under two URL styles (`/settings-…` and `/settings/…`). Phase 4 should choose one.
8. **Dead route stub.** `/settings-service-provider` is a placeholder for ST-28, deferred by D-015. It is not linked in the sidebar.
9. **Unlinked routes.** 112 of 156 routes are not in the sidebar `nav.ts`. Many are create or detail pages reached from a list, a hub, or a row action (for example `/clients/create`, `/settings/branches/new`), and report pages are reached from hubs. This crawl did not follow every link to confirm each one is reachable from a visible control. That confirmation belongs to Phase 3.

## Branding and encoding

10. **No "Wakandi" text on any rendered page.** Checked on all 156 routes. The word appears only in `docs/` and `tools/corpus/`, where AGENTS.md rule 7 allows it as evidence.
11. **Encoding glitch in a source comment.** `packages/ledger/src/seed.ts` header contains a mojibake dash (`â€”`). It is not rendered in the UI. Fix it in Phase 5 with the COA change, since that file is being rewritten.

## Not covered by this phase

These checks are part of the Phase 1 list but need Phase 3 measurement (per-page computed styles and bounding boxes against the reference):

- Collapsed and expanded sidebar behaviour, and active-pill alignment.
- Header layout and branding placement.
- Typography, spacing, colours and icon consistency across pages.
- Dropdown behaviour, including whether selects are searchable (the crawl only counted them: `nativeSelects` and `comboboxes` per page are in the JSON).

## Next

Phase 2 (Wakandi screenshots) needs an OCR engine. None is installed (see `stack.md`). Phase 2 cannot start until one is approved.
