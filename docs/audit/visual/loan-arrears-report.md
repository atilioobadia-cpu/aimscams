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
