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

## Implementation update (2026-11-03)

Replaced the unrelated generic accounting balance page with the shared loan report title/download card, date/filter toolbar, Submit/Clear actions, and horizontally scrollable table. Added report-specific columns based on the saved reference notes. Results are empty because a matching local report endpoint is unavailable; no Wakandi rows were copied. Checked the visible AIMSCAMS page. Wakandi live DevTools dimensions are unverified because SSO reCAPTCHA blocks the session.
