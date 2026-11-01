# Expected Repayment Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-ExpectedRepaymentReport\FULL.png`  
AIMSCAMS route: `/reports-loan-ExpectedRepaymentReport`

## Comparison

The reference page has date-range controls, loan-officer/product/institution/group/region filters, Submit/Clear, and Download. Its wide table reports principal balance, principal due, interest due, penalty due, and total due with sortable and column-filter controls.

AIMSCAMS shows a single as-of date with Refresh and the generic chart-of-accounts balance columns. No expected-repayment fields or loan filters are present.

## Recommendations

- Provide a dedicated expected-repayment data query and matching filters.
- Map each balance/due/penalty amount from the approved response.
- Add the reference export and grid interactions after the report data contract is defined.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; report query and filter contracts are absent.
