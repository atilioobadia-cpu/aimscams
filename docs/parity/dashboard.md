# Dashboard parity pass

Status: measured layout match at the available desktop width; typography and live data remain intentionally different or data-dependent. Wakandi was inspected read-only in visible Chrome. AIMSCAMS uses local sample data only.

## Live measurement conditions

Routes: `/dashboard` in both applications. Measurement used `getBoundingClientRect()` and `getComputedStyle()` in the visible Chrome tabs. Both CSS viewports were 1225px wide; Wakandi was 567px tall at DPR 1, AIMSCAMS was 623px tall at DPR 1.5. The viewport control did not align their heights, so vertical shell heights are not directly comparable. Content y positions and widths are comparable.

## Reference geometry and AIMSCAMS verification

| Element | Wakandi | AIMSCAMS after fix |
|---|---:|---:|
| Header | `(0, 0, 1225.33, 64.67)` | same |
| Expanded sidebar | `(0, 64.67, 200, 502.67)` | `(0, 64.67, 200, 558.67)` due viewport height |
| Main content viewport | `x=200, y=64.67, w=1025.33`, internal content width 1010px | same x/y/width and 1010px content width |
| Overview tabs card | `(213.44, 78.10, 983.13, 70.42)` | same |
| KPI cards | 4 × `(235.7 × 123.75)`, first at `(213.44, 161.96)` | same within 0.01px |
| Main chart card | `(213.44, 299.15, 983.13, 495.58)` | same within 0.01px |
| Lower chart cards | first `(213.44, 808.17, 484.84, 495.58)`, second x `711.72` | same within 0.02px |
| Filter card (Members/Loans) | `(220.16, 168.68, 969.69, 76.57)` | same within 0.01px |
| Members Growth card | `(213.44, 251.97, 983.13, 495.58)` | same within 0.01px |
| Loans metrics row | first `(213.44, 251.97, 318.75, 123.75)`; 13.44px gaps | same within 0.01px |
| Loans chart pair | first `(213.44, 389.16, 481.48, 495.58)`; second x `715.07` | same within 0.01px |
| Loans table panels | y/heights: `1407.20/279.65`, `1700.28/316.46`, `2030.18/279.65`, `2323.26/290.40` | same within 0.02px |

Dashboard internal scroll heights match at the measured states: Overview 1279px, Members 3818px, Loans 2589px. AIMSCAMS has a fixed main viewport with an internal vertical scrollbar and no document-level scroll. The local dashboard filter popover width is 350px and its top is within 0.17px of the Wakandi popover. The Guarantor search field now matches Wakandi's 268.8px width, 34.125px height, placeholder, border, padding, and position.

The v1.2.0 typography instruction remains in force: AIMSCAMS body text is 12.8px with a 16px root, while the live Wakandi page uses 13.44px body text. This means glyph sizes, some text widths, and a few label-driven control widths are intentionally not exact. Dashboard metric values and table rows differ because Wakandi is production and AIMSCAMS uses local data; no Wakandi data was changed.

## Changes made

- Constrained the main content to the area below the header and restored the internal scrollbar.
- Matched shared dashboard card borders, radius, padding, tab geometry, chart heights, and spacing.
- Matched Members/Loans filter panel inset, height, popover offset, dashboard gutters, and table row density.
- Removed the extra Overview bottom strip and matched internal scroll extents.
- Kept the font scale at the user's v1.2.0 size.

## Verification and remaining work

- Visible Chrome comparison completed for Overview, Members, and Loans; clicked tabs and opened the Gender filter without choosing or applying values.
- Typecheck passed. `git diff --check` passed. Targeted ESLint could not run because ESLint 9 could not find an `eslint.config.*` file in the repository.
- Responsive widths, all filter option menus, keyboard/focus/hover states, chat placement, and console output remain to be checked before calling the Dashboard fully complete.
