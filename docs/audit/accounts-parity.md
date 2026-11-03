# Accounts pages visual parity notes

Reference: the signed-in Wakandi session, inspected read-only in Chrome DevTools. Values below are CSS pixels from the rendered reference at the current desktop viewport; production records were not copied into this report.

## Shared measurements

- Typeface: Roboto.
- Page title: 20.16px, weight 600, `#495057`.
- Tabs: 45px high; selected tab has a white background, teal text and underline; inactive tabs use `#f8fafc` and `#6c757d`.
- Filter toolbar: 56px high, 10.08px padding, `#dee2e6` border and 6px radius.
- Search: 191x34px, 6px radius, 0.67px teal border; reference text is 13.44px.
- Table header: 37px high, `#f8fafc`, 13.44px/700, `#495057`, padding 10.08px 13.44px.
- Filter and action buttons use a 0.67px teal border, 6px radius, transparent or white fill, and teal text.

## Loan Applications

- Header card is 69.33px high. The New Loan Application action is 152x29px, 11.76px/500.
- Pending, Approved and All tabs use the shared tab geometry.
- Toolbar controls: Search 191x34px; Loan Officer 106x35px; Status 101x35px; Add Filters 90px wide; save/clear icons 30x27px.
- Visible table columns: Member Name, Product, Loan Officer, Stage, Status, Tenure, Tenure Period, Created Date, Loan Amount (TSh), followed by the column settings control.

## Loans

- Active, New and Closed tabs use the shared tab geometry.
- Toolbar controls: Search 191x34px; Loan Officer 106x35px; Add Filters 131.33x35px; save/clear icons 30x27px.
- Table minimum width is 1548px and intentionally scrolls horizontally. Columns: Account Number, Member Name, Product, Loan Officer, Status, Tenure, Loan Amount (TSh), Balance (TSh), Created Date, Overdue Days, Provisioning Status, and the column settings control.
- Column settings open a 269px right drawer over a dimmed page. Its header is 72px high with 20px horizontal padding; checkbox list scrolls vertically; Reset and Save remain in the footer.

## Savings

- Header card is 69.33px high. New saving is 97x29px, 11.76px/500.
- Toolbar controls: Search 191x34px; Product 83x35px; Status 76x35px; Add Filters 131x35px.
- Product filter opens a 350x290px popover with a 13.44px inset, condition and value controls, and Clear/Apply actions.
- Table columns: Account Number, Member ID, Member Name, Product, Type, Creation Date, Status, and the column settings control.

## AIMSCAMS typography constraint

The project retains the v1.2.0 global type scale (`--fs: 12.8px`, `--fs-title: 20px`) as requested. Component geometry, colors, borders, weights and hierarchy follow the measured reference; body and table text therefore remain on the project scale rather than increasing global font sizes to 13.44px.
