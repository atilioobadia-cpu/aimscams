# Expected Loan Repayments Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-ExpectedLoanRepaymentsReport\FULL.png`  
AIMSCAMS route: `/reports-loan-ExpectedLoanRepaymentsReport`

## Comparison

The reference provides a due date, loan-officer/product/institution/group/region filters, Submit/Clear, and a sortable/filterable table. The visible totals are expected principal, expected accrued interest, and total repayment amount, with a bold total row. Download is available from the title card.

AIMSCAMS offers only an as-of date and Refresh, then shows the chart-of-accounts balance table. The loan repayment totals visible in the reference have no corresponding local fields.

## Recommendations

- Connect the route to a date-scoped expected-repayment report query and filter model.
- Provide the reference amount columns and total row from that response.
- Add the reference download action and check populated values against approved data.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; report query and filter contracts are absent.
