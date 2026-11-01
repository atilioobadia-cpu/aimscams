# AIMSCAMS visual parity implementation plan

Status: Active. Implementation and visual verification are underway at the user’s direction.

This plan turns the 175-entry Wakandi-reference audit into coordinated AIMSCAMS work. Its target is consistent layout and interaction fidelity while retaining AIMSCAMS identity and implementing supported product behavior. The route name in a screenshot folder is a reference ID, not assumed to be an AIMSCAMS URL.

Related records: [visual audit index](../docs/audit/visual/index.md), [page queue](../docs/audit/queue.md), [issue register](../docs/audit/issues.md), [existing visual fix plan](../docs/audit/fix-plan-ui-match.md), [UI contract](../docs/11-ui-contract.md), [build sequence](../docs/13-build-sequence.md).

## Decisions and guardrails

- `docs/11-ui-contract.md`, `DECISIONS.md`, and the page's domain specification are the sources of truth. When older comparison notes disagree with the current contract, follow the current contract and record the resolution.
- Preserve AIMSCAMS wordmark, tenant identity, active navigation exception, sentence-case labels, and synthetic demo identity. Use screenshots for layout, color, control, density, and interaction evidence; do not copy Wakandi branding or real people/financial records.
- Keep route identity synchronized across the screenshot reference ID, canonical local route, rendered page title, reference state, local fixture, page note, visual index, and queue. A flat screenshot-folder slug returning 404 is not evidence of a missing page until the local route map, app route tree, navigation link, page title, and content have been checked. For dynamic detail pages, use a deterministic local synthetic record ID.
- Add deterministic, idempotent synthetic fixtures only to local development/test environments. Reuse the actual domain, API, validation, permissions, and posting rules. Never seed reference screenshot data. Do not mutate or truncate existing databases as part of seeding.
- Money remains integer minor units and ledger entries remain append-only. Next.js stays a reader; API/domain services own writes. Any financial fixture must reconcile through the ledger rules.
- Build one vertical feature slice at a time: data contract, API, permissions, deterministic fixture, UI, states, then browser verification. Do not make a visual-only mock look functional.
- Keep the in-app browser visible for page-by-page review; use the repository Playwright audit for reproducible screenshots and assertions. Keep reference navigation read-only.

## Phases

### Phase 0 — Route and evidence reconciliation

Resolve every reference folder ID to its canonical AIMSCAMS route before coding. Use `docs/audit/reference-map.json`, the Next.js `apps/web/src/app` route tree, navigation links, rendered page title, and unique page content. Verify aliases in the visible browser. Record true missing routes separately from wrong screenshot-slug URLs, and record missing local sample records separately from missing route implementations. Update the reference map and affected page notes/index/queue consistently.

**Exit:** all 175 queue entries have a canonical route or a documented reason no local route exists; no page is called missing based only on the folder slug; navigation destinations resolve or use the shared `ComingSoon` contract.

### Phase 1 — Measurement and UI contract baseline

Use the current contract values in `docs/11-ui-contract.md`, recalibrate each reference image to its actual viewport/device scale, and capture a comparable local baseline. Audit the screenshot-diff tooling for dynamic data masks applied to both images. Record viewport, browser zoom, DPR, scroll position, route, and UI state. Reconcile stale numbers/targets in older audit plans before using them. Measure hover/focus states only where the reference or UI contract provides evidence; otherwise record the choice as an AIMSCAMS interaction rule.

**Exit:** a repeatable baseline report exists for representative shell, list, form, modal, statement, and report pages; measurements use the current contract and exclude dynamic personal/financial text from structural comparison.

### Phase 2 — Shared shell and reusable UI components

Verify shared tokens and shell first, then fix only measured defects. Consolidate the page title card, cards, button variants, inputs/selects/date controls, filter bars, tabs, status badges, tables, row actions, pagination, banners, modal framing, and loading/empty/error/forbidden states. Shared components must support measured page variations without a generic layout forcing unrelated workflows into the same shape.

**Exit:** all changed components use the UI contract tokens and spacing, are keyboard accessible, have consistent focus/hover/loading states, and pass shared screenshot checks on representative routes at both required viewport sizes. Pages already matching stay unchanged.

### Phase 3 — Synthetic demo data and domain contracts

Inventory the current seed/API contracts first. Add an idempotent local/test fixture set with linked synthetic institution, branches, users/roles, clients/groups, membership policies, loan/savings products, accounts, loans, requests, transactions, ledger entries, and report data in dependency order. Use realistic but invented values, varied statuses and empty-case fixtures. Give synthetic entities stable IDs so dynamic reference states can be navigated repeatedly. Separate fixtures from production bootstrap and never import screenshot records.

**Exit:** a clean local/test setup can load the same deterministic fixtures repeatedly without duplicates; routes can show representative populated and empty states; permissions and account balances reconcile; the normal application write path enforces domain rules. Open product questions remain explicitly documented rather than being guessed.

### Phase 4 — Settings and product foundations

Implement the supported organization, branch, accounting-setting, user/role, policy, calendar, charge/rate, and loan/savings product screens on the shared components. Include create/detail/edit routes and page states where the blueprint and APIs support them. Add only the fields needed by defined product contracts. Use the synthetic fixtures to compare populated settings states. Keep open decisions such as campaign/service scope or regulatory data sources in `NEEDS-HUMAN` until a reliable contract exists.

**Exit:** canonical settings links resolve; lists and forms use the right page structure and state; synthetic examples render; validation and permissions match the API; no settings are saved during visual review.

### Phase 5 — Clients, accounts, and loans

Close audited gaps in client/group lists and forms, savings-account workflows, loan applications, loan details, schedules, repayments, charges, guarantors, and documents. Implement page-specific structures using real domain/API fields and linked fixtures. Keep each detail route backed by a local synthetic record rather than a reference ID.

**Exit:** list/detail/create/edit routes map to the correct entities, states and navigation; no orphan detail links; loan/account totals reconcile; populated and empty states match the intended reference structure.

### Phase 6 — Transactions, teller, requests, and accounting

Complete teller category flows, transaction history, online provider and reconciliation states, approvals, request queues, accounting lists, and reconciliation screens as vertical slices. Do not introduce actions that the backend cannot perform. Preserve financial authorization, audit-event, idempotency, and append-only ledger rules. Use synthetic transactions with balanced accounting consequences for visual states.

**Exit:** all visible controls have truthful behavior and permissions; no presentational substitute is used for a missing financial endpoint; transaction/ledger fixtures reconcile and browser review does not post real or unintended entries.

### Phase 7 — Reports and statements

Replace generic chart-of-accounts fallbacks with report-family definitions and dedicated data/query contracts. Reuse filter, table, totals, export, and print components while keeping each report's own filters, columns, grouping, calculations, and empty state. Implement accounting, loan, client, savings, transaction, statement, and MSP schedules according to their domain specifications. Add deterministic synthetic report fixtures. Do not invent regulatory calculations or unresolved MSP10/MSP11 source data; document any remaining product decision.

**Exit:** each report route renders its own correct structure and supported data; filters/actions correspond to implemented backend behavior; financial totals reconcile; statement and chart-of-accounts pagination follows D-034; unresolved contracts are explicitly listed.

### Phase 8 — Remaining modules and route completeness

Review import, messages, business account, services, campaigns, system logs, and any orphan/placeholder routes against the blueprint and settled scope. Align shared shell and navigation. Keep legitimately out-of-scope pages on the accessible `ComingSoon` pattern rather than inventing workflow or sample content. Resolve or document open scope decisions.

**Exit:** every navigation destination resolves, each captured reference has a documented canonical route/state, and each out-of-scope page says so clearly.

### Phase 9 — Full-system visual and behavior regression

Replay every mapped reference page in batches using the visible in-app browser and Playwright. Compare matching states and calibrated captures at the UI-contract viewports, including collapsed sidebar and required dropdown/modal/hover/focus states. Check accessibility tree, console, same-origin network failures, overflow, forms, filters, pagination, permissions, and synthetic data. Update page notes and queue status; mark a page `PASS` only after its visual and behavior gates pass. Commit and push verified page batches as authorized.

**Exit:** no unexplained route mismatch, TODO, visual regression, failed interaction, console error, or fixture inconsistency remains; `docs/audit/final-report.md` records passes and accepted limitations.

## Per-page acceptance gate

- The reference ID resolves to the correct canonical AIMSCAMS page by title and content; direct route, internal navigation, and dynamic record link agree.
- At the required calibrated viewports, shell, spacing, color, control geometry, typography, table density, and scrolling meet `docs/11-ui-contract.md` and the page-specific reference state.
- Loading, empty, populated, error, and forbidden states are truthful and visually complete where applicable; interaction states are keyboard accessible.
- Synthetic data is deterministic, linked, privacy-safe, and created through supported seed/API/domain paths; financial totals and ledger effects reconcile.
- Focused tests, typecheck/build, Playwright checks, and visible-browser review pass for the touched feature slice; report evidence and any accepted limitation.
- Page note/index/map/queue stay synchronized; the queue is set to `PASS` only when all acceptance checks pass.

## Task list

The actionable checklist and checkpoints are in [tasks/todo.md](todo.md). Keep tasks small enough to finish and verify as one page or one shared component slice.
