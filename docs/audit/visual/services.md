# Service providers visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-service-provider\FULL.png`  
AIMSCAMS route: `/settings-service-provider` (confirmed as the service-provider screen; `/settings/services` is the separate value-added catalogue).

## Comparison

The reference shows a compact title card labelled Services and otherwise an empty main workspace. Before the fix, `/settings-service-provider` rendered a “Service providers” Coming soon placeholder with explanatory copy and a large card. The visible browser at 1280×720 shows the same icon tile, Services heading, compact title card, and empty workspace as the reference. The title card begins at x=257, y=95 locally and x=257, y=96 in the reference; both use the shared shell spacing and have no extra placeholder content. The previous pixel report remains unscored because it used the wrong route.

## Recommendations

- Use the shared title-card component at the measured reference height and include the icon tile.
- Keep the workspace empty until service-provider behavior and data have a supported contract; do not show a placeholder panel in this reference state.

The page and Settings > Services destination are implemented in `apps/web/src/app/(app)/settings-service-provider/page.tsx` and `apps/web/src/lib/nav.ts`. The visible browser recheck confirms the reference title card and empty workspace. No service data or configuration was changed. Pixel score remains unscored pending a reproducible canonical screenshot.
