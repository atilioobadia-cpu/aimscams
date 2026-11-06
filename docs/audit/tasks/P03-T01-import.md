# P03-T01 — Import

State: `VERIFIED_MATCH`

Reference: `https://cams.wakandi.co.tz/import`
Local: `http://localhost:3000/import`

## Goal check (M9)

- Does this move the page to `VERIFIED_MATCH`? Yes — the local placeholder now matches the live Wakandi placeholder exactly (container, h2, paragraph) at 1920×1080@1, 1536×864@1.25 and 1280×590@1.5.
- Anything outside the plan? No. The earlier "3 import flows" assumption was incorrect; the live Wakandi `/import` page is itself a placeholder ("Import functionality will be implemented here.").

## Verification (T6)

- Container: 213.44,78.1,1693.13×114.44, padding 13.44px.
- h2: 226.88,108.27,1666.25×24.67, 20.16px, 700, margin 16.7328px 0.
- p: 226.88,149.67,1666.25×16, 13.44px, 400, margin 13.44px 0.
- Console: 0 errors, 0 warnings.

## Checklist

- [x] T1 scope confirmed
- [x] T2 live Wakandi inspected
- [x] T3 differences documented
- [x] T4 implementation plan written
- [x] T5 code implemented
- [x] T6 re-measured at all three viewports
- [x] T7 regression tests added/updated
- [x] T8 committed as `parity(P03-T01): match import to live Wakandi`
- [x] T9 status updated to `VERIFIED_MATCH`