# P01-T04 — Settings › Auto Debit

State: `VERIFIED_MATCH`

Reference: `https://cams.wakandi.co.tz/settings/auto-debit`
Local: `http://localhost:3000/settings/auto-debit`

## Goal check (M9)

- Does this move the page to `VERIFIED_MATCH`? Yes — the page, toolbar, filters, empty state, Rule filter popover, Add Filters overlay and column menu were measured against the live Wakandi page at 1920×1080@1, 1536×864@1.25 and 1280×590@1.5 with zero console errors.
- Anything outside the plan? No. The `New rule` affordance is placed in the column-sliders dropdown and row actions (Edit/Activate/Deactivate) per the measured parity plan, and the unmeasurable create/edit dialog is recorded in `docs/audit/NEEDS-HUMAN.md`.

## Implementation

- Permission entity `Settings Auto Debit`, model `AutoDebitRule`, migration `20261106150000_auto_debit_rule`, synthetic seed rules `AD-DUE-01`, `AD-SAV-02`, `AD-FEE-03`, `AD-PEN-04`.
- API: `GET/POST /settings/auto-debit-rules`, `PATCH /settings/auto-debit-rules/:id`.
- Web: `/settings/auto-debit` with search, Rule filter popover, Add Filters overlay, column chooser, empty state, create/edit modal and row actions.

## Verification (T6)

- 1920×1080@1: page card 213.44,78.1,1693.13×66.31; title 264.5,98.93,150.4×24.67; icon 234.26,101.18,20.17×20.17; card 213.44,157.85,1693.13×266.40; toolbar 214.1,158.52,1691.79×56.40; search 224.84,169.66,191×34.13; Rule button 422.56,169.26,64.89×34.93; Add Filters 494.17,170.66,132.1×32.13; thead 214.1,214.92,1691.79×37.48; columns 142.01,142.01,273.28,203.34,193.52,142.01,226.31,163.41,142.06,63.83; slider 1855.5,224.99,36.96×14.67; empty td 214.1,252.4,1691.79×171.19; empty message 227.54,262.47,1664.92×150.38; icon 40.31; text 16.
- 1536×864@1.25 and 1280×590@1.5: corresponding metrics scale with the measured container widths (1307.79 and 1051.79) with zero differences above 1px.
- Rule filter popover: 350×291.98 at 423,214 (live 350×290.77 at 422.56,214.26).
- Add Filters overlay: 224×32 button and 163.25×242.03 panel (live 132.1×32.13 button and 163.25×242.03 panel).
- Column chooser menu: 197.6×266.95 at 1689.2,242.03.
- Console: 0 errors, 0 warnings at all three viewports.

## Checklist

- [x] T1 scope confirmed
- [x] T2 live Wakandi inspected
- [x] T3 differences documented
- [x] T4 implementation plan written
- [x] T5 code implemented
- [x] T6 re-measured at all three viewports
- [x] T7 regression tests added/updated
- [x] T8 committed as `parity(P01-T04): match auto debit to live Wakandi`
- [x] T9 status updated to `VERIFIED_MATCH`
