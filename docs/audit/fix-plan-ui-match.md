# Current UI parity implementation plan

Status: Planning only. The audit is complete; implementation begins when the user says to start.

This file replaces the earlier phase sequence. The single detailed, authoritative phase plan and acceptance criteria are in [tasks/plan.md](../../tasks/plan.md); its implementation checklist is in [tasks/todo.md](../../tasks/todo.md). Do not follow or revive a previous phase order.

## Current phase order

1. **Route and evidence reconciliation:** map every screenshot reference ID to the canonical AIMSCAMS route by checking the route map, app route tree, navigation, rendered title, and page content. A screenshot-folder slug returning 404 is treated as a possible naming mismatch, not a missing page. Distinguish missing sample records from missing routes and keep route maps, notes, index, and queue synchronized.
2. **Measurement baseline:** calibrate each screenshot to its viewport/device scale and use the current `docs/11-ui-contract.md` as the visual authority. Mask dynamic personal/financial data when comparing layout; record viewport, zoom, DPR, route, and UI state.
3. **Shared UI components:** verify the shell and measured tokens, then align shared titles, cards, buttons, fields, filters, tabs, badges, tables, pagination, dialogs, and loading/empty/error/forbidden states. Fix measured defects only and preserve AIMSCAMS identity.
4. **Synthetic data and domain contracts:** create deterministic, idempotent local/test fixtures through supported seed/API/domain paths. Use invented identities and values; never copy screenshot data or mutate production. Financial examples must use minor units and reconcile through ledger rules.
5. **Settings and products:** implement supported organisation, branch, accounting, users/roles, policy, calendar, charge/rate, and product workflows with representative fixtures.
6. **Clients, accounts, and loans:** complete linked list/detail/create/edit flows with synthetic records and verified balances.
7. **Transactions, teller, requests, and accounting:** implement truthful workflows with authorization, audit, idempotency, and append-only ledger rules; do not add presentation-only actions.
8. **Reports and statements:** replace generic chart-of-accounts fallbacks with page-specific report definitions, filters, fields, calculations, and supported actions. Do not invent unresolved regulatory data contracts.
9. **Remaining modules and full-system regression:** resolve navigation and scope, then replay every mapped page in the visible in-app browser and Playwright at calibrated viewports. Mark `PASS` only after visual, behavior, accessibility, and data checks pass; commit and push verified batches.

## Cross-phase rules

- Keep the reference ID, canonical route, rendered title/content, reference state, synthetic fixture, page note, visual index, and queue entry in sync.
- Build vertical feature slices from data contract through API, permissions, fixture, UI, states, and browser verification.
- Keep the in-app browser visible during page review. Wakandi references remain read-only.
- Preserve AIMSCAMS branding and sentence-case UI text. Never copy real people, institution details, or screenshot financial values into fixtures.
- Follow `AGENTS.md`, `DECISIONS.md`, `docs/11-ui-contract.md`, and `docs/13-build-sequence.md` where applicable.

## Completion gate

Every mapped page must resolve to its canonical route or carry an evidence-based missing/scope reason; use the correct domain structure and truthful actions; show deterministic synthetic populated and empty states where applicable; pass the calibrated browser, accessibility, console/network, and repository checks; and have synchronized audit records. Unresolved domain decisions stay documented rather than guessed.
