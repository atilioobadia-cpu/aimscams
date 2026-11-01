# Issued Loans and Arrears Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-IssuedLoansAndArrearsReport\FULL.png`  
AIMSCAMS route: `/reports-loan-IssuedLoansAndArrearsReport`

## Comparison

The reference uses date-range, loan-officer, product, institution, region, and group filters with Submit/Clear and Download. Its wide table has pagination (50 rows per page in the capture) and arrears columns including charges in arrears, outstanding penalty, penalty in arrears, and total in arrears.

AIMSCAMS shows a single as-of date and Refresh above the chart-of-accounts balances; no issued-loan or arrears fields or paging controls are present.

## Recommendations

- Provide the issued-loans/arrears query, filter dimensions, and page-size contract.
- Map arrears and penalty columns from the report response.
- Recheck grid pagination and horizontal overflow with approved report data.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; loan arrears report query/filter contract is absent.
