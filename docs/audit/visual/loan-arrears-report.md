# Loan Arrears Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-LoanArrearsReport\FULL.png`  
AIMSCAMS route: `/reports-loan-LoanArrearsReport`

## Comparison

The reference provides date-range, loan officer, product, institution, group, and region filters with Submit/Clear and Download. Its wide table includes penalty in arrears, total in arrears, principal-in-arrears percentage, and days in arrears.

AIMSCAMS shows only an as-of date and Refresh, then reuses the chart-of-accounts table. It has no loan arrears amounts or aging fields.

## Recommendations

- Add a dedicated arrears query with defined days/percentage calculations.
- Map principal, interest, fee, penalty, and total arrears using approved financial rules.
- Validate calculations against permitted records before adjusting the report grid.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; arrears query and financial rules are absent.

## Implementation update (2026-11-03)

Replaced the unrelated generic accounting balance page with the shared loan report title/download card, date/filter toolbar, Submit/Clear actions, and horizontally scrollable table. Added report-specific columns based on the saved reference notes. Results are empty because a matching local report endpoint is unavailable; no Wakandi rows were copied. Checked the visible AIMSCAMS page. Wakandi live DevTools dimensions are unverified because SSO reCAPTCHA blocks the session.
