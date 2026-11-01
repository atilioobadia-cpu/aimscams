# Loan Outstanding Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-LoanOutstandingReport\FULL.png`  
AIMSCAMS route: `/reports-loan-LoanOutstandingReport`

## Comparison

The reference provides an as-of date, loan officer, product, institution, group, and region filters with Submit/Clear and Download. The wide sortable/filterable grid includes total outstanding interest, charges, total outstanding amount, and total in arrears; a total row is visible.

AIMSCAMS renders the generic chart-of-accounts balances. The loan-level outstanding totals and portfolio filter controls are absent.

## Recommendations

- Bind the route to loan outstanding data with defined principal, interest, charge, and arrears fields.
- Add the reference date and portfolio filters, total row, and export action.
- Verify totals against approved loan data before layout refinement.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; outstanding-loan query/filter contract is absent.
