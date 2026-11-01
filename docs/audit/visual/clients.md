# Clients list visual audit

## Evidence

- Reference: `F:\Wakandi\clients\FULL.png` (1838 × 1368 pixels; calibrated DPR 1.25, 1470 × 1094 CSS px).
- AIMSCAMS: `/clients`, visible Playwright-backed browser at 1470 × 1094 CSS px (DPR 1.0).
- Local text and record content were not copied into this report.

## Implemented measurements

| Element | Reference target | Local after change | Result |
|---|---:|---:|---|
| Header / expanded sidebar | 76px / 240px CSS | 76px / 240px | Matched |
| Content inset | x=256px, y=94px | x=256px, y=94px | Matched |
| Title card | 1198 × 84px at x=256, y=94 | 1198 × 84px at x=256, y=94 | Matched |
| Toolbar | y≈195px, 1198px wide | y=196px, 1198px wide | Within 1px |
| Search / Type / Status / Add filters | 230 / 80 / 90 / 158px wide; 42px high | 230 / 80 / 90 / 158px; 42px high | Matched |
| Table header / body row | ≈45px / ≈69px | 44.3px / 68.3px | Within 1px |
| Table viewport / content | ≈1196px / horizontally scrollable | 1197px / 1495px content | Matched structure |
| Page controls | pager and page-size selector | pager and page-size selector | Present; local total reflects local data |

The title card, toolbar, column region and footer pager now follow the screenshot structure. The local
browser returned no console errors or warnings after the changes. The page's extra filters were
opened and exercised with a nonmatching value; the empty state appeared, then the filter was cleared.
The sidebar was collapsed and expanded; collapsed width measured 76px.

## Remaining differences and blockers

1. The screenshot shows three outlined actions. The local title card now shows all three, but the
   Client activation link dialog reports that no activation-link service is configured. Its visible
   control matches; its action does not. Do not invent a secure token flow without a backend route.
2. The reference table contains multiple rows and a larger total. The local environment currently
   returns one row. Pagination is present and operates over returned rows; no reference records were
   copied or local records changed.
3. The local table retains product fields after the shared initial columns. The visible first-column
   order follows the reference; later column content is data- and viewport-dependent.
4. Hover and focus colors are not established by the reference capture and remain recorded in
   `NEEDS-HUMAN.md`.

## Status

Shared shell scale, Clients title card, filter toolbar, table row density and pagination structure have
been adjusted and measured. This page is not a 100% match while activation-link behavior and the
reference data state remain unresolved.
