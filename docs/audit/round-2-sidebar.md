# Round 2 — Sidebar

**Status:** Implemented; browser-harness verification is blocked by stale Playwright storage state.
**Reference:** Live Wakandi Admin page, inspected in Chrome DevTools on 2026-11-02. Wakandi remained
read-only. The AIMSCAMS route contains local QA data; no records were changed for this sidebar work.

## Direct F12 measurements

Viewport with DevTools docked: 1211 × 315 CSS px, DPR 1.5.

| Element | Wakandi measurement |
|---|---:|
| Header | 64.67px high |
| Sidebar | 200px wide |
| Active Dashboard row | x=6.7, y=71.4, 175.9 × 29.4px |
| Client row | x=6.7, y=114.3, 175.9 × 29.4px |
| Requests row | x=6.7, y=275.6, 175.9 × 29.4px |
| Messages row | x=6.7, y=318.5, 175.9 × 29.4px |
| Business Account row | x=6.7, y=479.9, 175.9 × 29.4px |
| Nav label font | 13.44px |
| Nav column gap | 6.72px |
| Sidebar footer | x=0, y=241.5, 199.3 × 73.9px |

The 1.5 DPR corresponds to the user-provided rendered target of about 300px rail, 44px row and
45px shell header. AIMSCAMS uses the CSS-pixel equivalents. The measured 64.67px header is recorded
for the next shell phase; this round intentionally changes sidebar only.

## Adjustments made

- Set expanded rail to 200px; nav item height to 30px; active pill width to 176px and height to 30px.
- Matched the first link inset and link/group vertical pitches to the measured row positions.
- Set icon and label sizes to 14px and 13.44px; set icon-label gap to 7px (6.72px target).
- Added the Campaigns chevron and removed its `Soon` badge to match the reference menu.
- Matched the 73.9px footer, footer type scale, and collapse control size/placement to the round’s target measurements.
- Updated `docs/11-ui-contract.md`, `docs/13-build-sequence.md`, and `tools/ui-audit/README.md` so
  they no longer specify the superseded sidebar measurements.

## Verification

The initial Clients audit stalled at `networkidle`; the harness now waits for `domcontentloaded` so
polling and sockets do not block the route check. After that correction, Playwright ran Clients,
Dashboard, and Accounting → Chart of Accounts at both configured viewports. All six checks reached
`/login` because `artifacts/storage-state.json` is rejected. Therefore no authenticated before/after
SSIM scores are available. Rerun the audits after refreshing the ignored storage state through the
approved login flow.

F12 confirms the Wakandi target values above. Local post-change bounding-box measurements remain
pending authenticated browser automation; do not mark them as passed.
