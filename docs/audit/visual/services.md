# Service providers visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-service-provider\FULL.png`  
AIMSCAMS route: `/settings-service-provider` (confirmed as the service-provider screen; `/settings/services` is the separate value-added catalogue).

## Comparison

The reference shows a compact title card labelled Services and otherwise an empty main workspace. Before the fix, `/settings-service-provider` rendered a “Service providers” Coming soon placeholder with explanatory copy and a large card. After the fix, the visible browser at 1838×1114 (DPR 1) shows the 94px title card at x=256, y=94 and an empty workspace. The reference shows the same card and blank workspace; its pixel report is still unscored because earlier comparison data used the wrong route.

## Recommendations

- Use the shared title-card component at the measured reference height and include the icon tile.
- Keep the workspace empty until service-provider behavior and data have a supported contract; do not show a placeholder panel in this reference state.

The page and Settings > Services destination are implemented in `apps/web/src/app/(app)/settings-service-provider/page.tsx` and `apps/web/src/lib/nav.ts`. Browser recheck passed for title, active navigation, dimensions, zero horizontal overflow, and no console warnings/errors. Pixel score remains pending a reproducible canonical screenshot.
