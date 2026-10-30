# UI match fix plan (Wakandi reference → AIMSCAMS)

Status: **draft, not started.** Implementation waits for the user's "go".
The earlier Phase 4 plan remains in `fix-plan.md`; this file covers the pixel and control
match work started on 2026-10-30.

## Where the measurements stand

| Measure | Value | Source |
|---|---|---|
| Pages compared | 142 | `tools/ui-compare/pages.json` |
| Pages passing structural criteria | 0 / 142 | `docs/audit/compare/SUMMARY.md` |
| SSIM range (unmasked) | 0.71 – 0.92 | `compare.py` run |
| Issues in register | 335 (216 text, 50 missing, 68 in-build, 1 header row) | `docs/audit/issues.md` |
| Structural masking | **not implemented** | open |
| DPR/viewport calibration check | **asserted, not re-measured** | `calibration.md` |
| Controls inventory (Step 3) | **not started** | open |
| Control-level comparison (Step 5) | **not started** | open |

Two gaps must close before the numbers can be trusted:

1. `compare.py` compares unmasked pages, so dynamic data (names, amounts, dates) inflates
   every diff. Masks must come from OCR of the reference, applied to both images.
2. The 1.125× capture scale in `calibration.md` came from sidebar/header ratios. It has not been
   checked against DPR 1.25 / 1.5 / 2 at matching viewports. Do this before any fix.

## Phase order

Shared fixes first, so one change clears many pages.

### Phase 0 — Measurement gate (no UI change)
- Structural masking in `compare.py`; re-run `npm run ui:compare`.
- DPR/viewport check (1, 1.25, 1.5, 2) on 5 sample pages; update `calibration.md` with results.
- Controls inventory per page: `docs/audit/components/<page>/controls.json`, `controls.md`, `crops/`.
- Exit: structural SSIM and CPR reported per page with masks; calibration confirmed or corrected.

### Phase A — Theme tokens and surfaces
- Colors, typography (`--fs-title` 20px per D-033, body 12.8px), radius, shadow, page background,
  card surface, from `docs/audit/components/COMPONENT-SPEC.md` after Phase 0 corrects it.
- Files: `apps/web/src/app/globals.css`, theme token file(s).
- Exit: colour delta CIEDE2000 ≤ 2 on sampled shell regions for 5 sample pages.

### Phase B — Shell: sidebar, header, footer
- Sidebar structure and nesting (12-item sidebar, D-024), collapsed mode, active pill kept in our
  dark green (exception to the 100% match), AIMSCAMS wordmark, footer text
  "© 2026 AIMSCAMS. All rights reserved.".
- Exit: sidebar, header and footer geometry within ±2 px on dashboard, clients, accounting and
  reports pages, at both viewports; collapsed sidebar checked (docs/11 §8).

### Phase C — Shared components (implemented once, applied everywhere)
- Buttons (primary/outline/text/icon), inputs, selects, date pickers, search box, filter bar,
  tabs, badges, tables (header, row, actions column), cards, banners, modals, pagination,
  `RowActionsMenu`.
- Each component gets a Playwright test that asserts computed styles against COMPONENT-SPEC.
- Exit: component tests green; the control-level comparison passes on the shared controls of
  every page that uses them.

### Phase D — Reports (loan and statement, currently "in build")
- Replace every in-build report with its real layout, columns, totals, working filters, and
  export/print where the reference shows them. MSP and loan detail pages need backend data that
  does not exist yet; those stay in NEEDS-HUMAN until the data source is confirmed.
- Exit: no in-build text in the report pages; structural criteria pass for each report page.

### Phase E — Remaining pages, by importance
Dashboard, clients, accounts, transactions, accounting pages, reports hub, requests, messages,
campaigns, import, business account, settings; then remaining in-build pages and orphan routes.
- Exit: each page passes the structural criteria, or has a NEEDS-HUMAN entry explaining why not.

### Phase F — Final regression
- Full `ui:compare` run; before/after table per page in `docs/audit/compare/SUMMARY.md`.
- Reference images converted to permanent Playwright visual regression tests with the same masks.
- Exit: `docs/audit/final-report.md` updated; no "Wakandi" text in the UI (grep evidence).

## Per-fix rules
- One commit per fix, pushed to origin/main, diff reviewed.
- After each fix: re-run the harness on the changed page and its neighbours; zero console errors,
  zero failed network requests; `npm test` and `npm run typecheck`.
- Sentence case for every new user-facing string (AGENTS.md typography rule).
- Money stays in minor units; no UI change may alter ledger behaviour.

## Open items for the user
- Font family: we use the family in `apps/web` styles; the reference family cannot be read from
  the image. Logged in NEEDS-HUMAN for confirmation.
- Hover and focus states that the reference never shows: will use the nearest visible state and be
  logged in NEEDS-HUMAN.
