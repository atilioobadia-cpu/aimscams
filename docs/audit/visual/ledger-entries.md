# Ledger Entries visual audit

Date: 2026-11-03
Reference: authenticated Wakandi `/accounting/ledger-entries` page inspected live in Chrome with read-only DevTools measurements.
AIMSCAMS route: `/accounting-ledger-entries`

## Live comparison

Both pages were inspected at a 1225 × 567 CSS-pixel viewport. Wakandi reports Roboto and the application content begins at x=213, after the 200-pixel sidebar and 13-pixel content inset.

| Element | Wakandi | AIMSCAMS after update |
| --- | --- | --- |
| Shared top header | 65 px high | 65 px high |
| Title and action row | Title text at x=261, y=99; 20.16 px. Export buttons at x=517/643/777, y=99; 29 px high. Period selector x=904, y=99; 280 × 29 px (245 × 27 px label). | Title x=261, y=99; 20.16 px. Export buttons x=517/643/777, y=99; 29 px high. Period button x=904, y=99; 280 × 29 px with a 245 px label. |
| Results card | x=213, y=182; 999 × 277 px; white, 8 px radius. | x=213, y=182; 999 × 277 px; white, 8 px radius. |
| Date Range filter | x=224, y=193; 102 × 35 px. Popover x=224, y=238; 350 × 291 px. | Same button and popover bounds. Condition options On, Before, After, Between; values apply to the local date query. |
| Ledger Account filter | x=333, y=193; 125 × 35 px. Popover x=333, y=238; 350 × 255 px. | Same button and popover bounds. Local selector lists postable accounts and applies the account-specific query. |
| Entry Type filter | x=464, y=193; 97 × 35 px. Popover x=464, y=238; 350 × 255 px. | Same button and popover bounds. Values include known local event codes and observed row codes. |
| Empty result state | No Entries Found and “No entries match your current filter criteria.” centered below the filters. | Same text and centered state; no table header is shown when the result set is empty. |

Reference filter borders and text use Wakandi teal `rgb(5, 117, 115)`, 0.667 px borders, 6 px radius, and 11.76 px Roboto labels. Local filter controls use those measured values. The live reference showed a 13.44 px Roboto body font, a white result card, and an 8 px card radius.

## Behavior and limits

- Date Range exposes On, Before, After, and Between. Clear resets the date query; Apply updates it.
- Ledger Account exposes the local postable accounts. Clear returns to the default first account because the current ledger API requires a single account.
- Entry Type exposes known local event types and event codes returned in the loaded account page. Applying the type narrows the loaded rows.
- Download PDF opens the browser print flow. Excel and CSV export the currently loaded/filtered account rows. No export was triggered during visual inspection.
- AIMSCAMS currently requests at most 50 rows for one selected ledger account. Wakandi’s broader ledger data/query behavior is not implemented locally, so cross-account row parity and full-result export parity remain open.
- No AIMSCAMS or Wakandi accounting records were created, edited, or posted during this pass.

## Verification

- Measured the live Wakandi page and local rendering through browser DevTools DOM/CSS evaluation at the same viewport.
- Opened the Date Range, Ledger Account, and Entry Type filters in both pages and compared their visible options and geometry. Filters were not applied.
- `npm run typecheck -w @aimscams/web` passed.
- `git diff --check` passed.
