# Expected Payment By Date Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-ExpectedPaymentByDateReport\FULL.png`  
AIMSCAMS route: `/reports-loan-ExpectedPaymentByDateReport`

## Comparison

The reference includes a date-range preset and range, loan-officer/product/institution/group/region filters, Submit/Clear, and a Download action. Its sortable/filterable results grid shows principal due, interest due, fee due, total due, and total overdue.

AIMSCAMS provides one as-of date and Refresh above generic chart-of-accounts balances. The page has neither the report filters nor expected/overdue payment fields.

## Recommendations

- Supply a date-range expected-payment query and its report filter model.
- Map due and overdue components to the reference grid after the contract is agreed.
- Add export and validate horizontal grid layout with approved report rows.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; report query and filter contracts are absent.
