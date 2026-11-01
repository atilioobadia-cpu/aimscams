# AIMSCAMS visual parity tasks

Implementation is active at the user’s direction. Phase 0 route reconciliation is complete; later phases remain pending.

## Phase 0 — Route and evidence reconciliation

- [x] Map each screenshot reference ID to a canonical AIMSCAMS route, rendered title, content signature, and reference state; reconcile route IDs against the app route tree and visible browser.
- [x] Verify suspected 404s by checking route map, Next.js route tree, navigation, and loaded page content; distinguish aliases, missing records, and genuinely missing routes.
- [x] Synchronize `reference-map.json`, per-page notes, visual index, queue, and route-crawl records for all route corrections.

**Checkpoint:** Complete. All 175 queue rows (142 unique reference IDs) resolve through the map to canonical routes; 3 stale null entries were corrected. Dynamic local records remain tracked separately from route existence.

## Phase 1 — Measurement and UI contract baseline

- [ ] Reconcile stale targets against `docs/11-ui-contract.md` and current decisions.
- [ ] Confirm reference/local viewport, DPR, browser zoom, and crop alignment for representative page families.
- [ ] Ensure structural screenshot comparisons mask dynamic data on both images; save reproducible baseline artifacts and measurements.

**Checkpoint:** Baseline can be repeated without assuming screenshot folder names are local URLs or treating dynamic values as layout defects.

## Phase 2 — Shared shell and UI components

- [ ] Measure shell on matching pages; fix only verified token/layout differences while retaining AIMSCAMS identity.
- [ ] Unify title cards, buttons, fields, filter bars, tabs, badges, tables/actions, pagination, banners, modals, and state components.
- [ ] Verify keyboard, focus, hover, loading, empty, error, and forbidden states in shared components.

**Checkpoint:** Representative pages using each shared pattern pass measured visual and accessibility checks; already matching pages do not regress.

## Phase 3 — Synthetic data and contracts

- [ ] Inventory existing seed scripts, APIs, and domain contracts; select isolated local/test targets.
- [ ] Create stable, deterministic, idempotent synthetic fixtures in dependency order, covering populated and empty states.
- [ ] Add linked entity IDs for dynamic detail routes and realistic text lengths without copying reference people, tenant details, or financial records.
- [ ] Verify authorization, validation, ledger invariants, integer-minor-unit amounts, and balanced accounting effects through existing APIs/domain rules.

**Checkpoint:** Fresh local/test data can be recreated safely and repeatably, without touching production or duplicating records.

## Phase 4 — Settings and products

- [ ] Implement organization/branch/accounting settings and user/role pages from their actual canonical routes.
- [ ] Complete policies, holidays, charges/rates, and product list/create/detail/edit screens against defined contracts.
- [ ] Seed representative settings and product records; verify filters, forms, approvals, and permissions.

**Checkpoint:** Settings pages, controls, fixtures, and navigation agree; unresolved product scope is listed rather than guessed.

## Phase 5 — Clients, accounts, and loans

- [ ] Complete client/group lists and create/detail states with linked synthetic records.
- [ ] Complete savings account/product-dependent flows and loan applications/details/schedule/repayment/charges/guarantor/document states.
- [ ] Verify amounts, balances, status transitions, permissions, and route links using synthetic records.

**Checkpoint:** Each account and loan page uses its domain contract and all linked totals reconcile.

## Phase 6 — Transactions, teller, requests, accounting

- [ ] Complete teller workflows, online collections/reconciliation, transaction lists/history, approvals, and request queues.
- [ ] Complete accounting lists, statements, and reconciliation workspaces with synthetic ledger-backed states.
- [ ] Verify maker/checker, audit logging, idempotency, permissions, and no unintended postings.

**Checkpoint:** Every displayed action has supported backend behavior; financial data is safe and internally consistent.

## Phase 7 — Reports and statements

- [ ] Replace generic chart-of-accounts fallbacks with dedicated report definitions and supported data queries.
- [ ] Implement filter, grouping, column, totals, statement, export, and empty-state behavior by report family.
- [ ] Add synthetic report fixtures and validate calculations against the domain/report specifications.
- [ ] Record unresolved MSP/regulatory data contracts in `NEEDS-HUMAN.md` without fabricating semantics.

**Checkpoint:** Each report has the correct structure and supported calculations; totals reconcile and pagination matches page type.

## Phase 8 — Remaining modules and routes

- [ ] Review import, messages, business account, services, campaigns, system logs, and orphan routes against settled scope.
- [ ] Ensure every sidebar and in-page navigation destination resolves; use `ComingSoon` only for documented scope gaps.

**Checkpoint:** No dead navigation destinations or undocumented missing routes remain.

## Phase 9 — Full-system regression

- [ ] Replay every mapped page/reference state in visible browser and Playwright batches at calibrated viewports.
- [ ] Check collapsed sidebar, menus/modals, hover/focus, accessibility tree, console/network, overflow, filters, pagination, and form behavior.
- [ ] Update page notes, map, index, queue, and final report; set `PASS` only after the page gate passes.
- [ ] Commit and push each verified page/feature batch.

**Final checkpoint:** All mapped pages are `PASS` or carry a specific accepted limitation; repository checks and production build pass.
