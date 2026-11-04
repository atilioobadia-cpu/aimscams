# Dashboard parity baseline

Status: incomplete. AIMSCAMS was inspected live, but no current Wakandi dashboard comparison could be made in this pass because the available Wakandi tab is at SSO. The local values below are evidence for the AIMSCAMS side only.

## AIMSCAMS live baseline

Route: `/dashboard`
CSS viewport: 1211.33 × 559.33 px
Device pixel ratio: 1.5
Measurement method: visible Chrome tab, `getBoundingClientRect()` and `getComputedStyle()`.

| Element | AIMSCAMS rect (x, y, w, h) | AIMSCAMS computed values | Wakandi | Difference |
|---|---:|---|---|---|
| Main content | 200, 0, 1011.33, 1425.97 | left margin 200px; top padding 64.67px | Not measured this pass | Not available |
| Dashboard content wrapper | 200, 64.67, 1011.33, 1361.30 | padding 14px 13.33px 84px | Not measured this pass | Not available |
| View tabs | 233.99, 97.32, 304.96, 32 | 5px radius; 7.65px gap | Not measured this pass | Not available |
| Active overview panel | 213.32, 161.99, 984.69, 1179.98 | top margin 14px | Not measured this pass | Not available |
| KPI cards (each) | first: 213.32, 161.99, 235.17, 123.32; four in row | white; 0.67px `#dee2e6` border; 8px radius; 20px padding | Not measured this pass | Not available |
| Funds in/out chart card | 213.32, 299.31, 984.69, 494.67 | white; 0.67px `#dee2e6` border; 8px radius; 21.33px padding | Not measured this pass | Not available |
| Savings/loans card | 213.32, 807.98, 485.01, 494.67 | white; 0.67px border; 8px radius; 21.33px padding | Not measured this pass | Not available |
| PAR card | 713, 807.98, 485.01, 494.67 | white; 0.67px border; 8px radius; 21.33px padding | Not measured this pass | Not available |

The document has no horizontal overflow at this viewport (client/scroll width 1211px). The page scroll height is 1426px. No warning/error entries were returned by the visible tab's collected console log window. This is not proof that all dashboard states or breakpoints are clean.

## Local issue candidate

The current chart heading's rendered text is `FundsInVsFundsOut` without spaces. Confirm the expected reference text in the live Wakandi page before changing it; this pass did not establish a visual parity difference.

## Required comparison before completion

1. Compare against the authenticated Wakandi dashboard at 1280 × 590, 1536 × 864, and 1920 × 1080 with equal CSS viewport and DPR.
2. Measure all matching KPI, chart, legend, axis, tab, and chat elements, plus hover/focus/empty/loading/error states.
3. Verify both dashboard tabs (Members and Loans), data-state parity, keyboard/mouse navigation, console output, and horizontal overflow.
4. Fix and remeasure until the objective's per-page thresholds are met; then attach final evidence and commit this page separately.

This page is not complete or certified as a parity match.
