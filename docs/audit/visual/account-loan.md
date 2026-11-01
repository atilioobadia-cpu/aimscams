# Loans list visual audit

## Evidence

- Reference: `F:\Wakandi\account-loan\FULL.png` (1838 × 1241 pixels; calibrated DPR 1.0).
- AIMSCAMS: `/account-loan`, inspected in the visible browser at 1470 × 1094 CSS px (DPR 1.0).
- No local loan rows exist; no reference records were copied and no local records were seeded or changed.

## Measured structure

| Element | Reference | AIMSCAMS after change | Result |
|---|---:|---:|---|
| Header / expanded sidebar | 76px / 240px | 76px / 240px | Matched |
| Title card | x≈257, y≈95, h≈82px | x=256, y=94, 1198×84px | Position matches; height within 2px |
| Status tabs | y≈195, h≈55px | y=196, h=55px | Within 1px |
| Toolbar and table card | x≈277, y≈266 | x≈277, y≈266 | Matched at the shared left edge |
| Table header | y≈337, h≈48px | y≈336, h≈45px | Starts within 1px; local header is 3px shorter |
| Table width / horizontal scroll | wider than viewport, scroll track visible | 1495px content in 1157px viewport | Scrollable structure present |

The reference viewport is 1838×1241 CSS px while the local inspection viewport is 1470×1094 CSS px. Widths are therefore not scored directly. The local table retains the reference’s first columns: account number, member, product, loan officer, status, tenure, amount and balance, followed by local row actions.

## Controls exercised

- Active, New, and Closed tabs switch the status group; Closed is selected on first load to match the reference capture.
- Loan officer options come from AIMSCAMS’ existing loan-officer endpoint. The loan response now includes the officer attached to its source application.
- Add filters exposes Product and Tenure period fields; entering a nonmatching product shows the empty result state.
- Clear filters resets search, optional filters, officer, and status tab.
- Save current filters opens an unavailable-state message because persistent saved-filter storage is not implemented.
- Pagination and page-size controls are present and reflect the local row count.
- Browser console errors and warnings: none after the update. Sidebar collapse/expand and tab/filter interactions were exercised.

## Remaining differences and blockers

1. The reference has 11 populated rows; AIMSCAMS currently has no loan rows. Row density, values, status badges, and page-two behavior cannot be verified without representative local test data.
2. The reference’s saved-filter action is active; AIMSCAMS explains the missing persistence service. The exact reference behavior for saving filters and the Add filters menu choices is not visible in the supplied capture and remains unresolved.
3. The local table uses the available AIMSCAMS loan fields and adds its existing View details action. Further columns should be compared against reference pages at a matched wide viewport.
4. Hover and focus colors remain unscored because the screenshot does not show those states.

## Status

The Loans list title, tab structure, toolbar, column region, horizontal scroll and pager now match the reference structure at the calibrated shell positions. Data-state parity and saved-filter persistence remain open.

## 2026-11-01 re-review

Wakandi reference: `F:\Wakandi\account-loan\FULL.png` and the visible Loans page. AIMSCAMS now displays the available `Created Date` and `Overdue Days` fields in the reference column order. Its API has no equivalent provisioning-status field; the table keeps that column and shows `N/A`. The separate risk-classification field is not used as a substitute. Local and Wakandi datasets differ, and no production records were copied or local data seeded.
