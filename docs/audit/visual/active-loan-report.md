# Active Loan Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-ActiveLoanReport\FULL.png`  
AIMSCAMS route: `/reports-loan-ActiveLoanReport`

## Comparison

The reference provides a period/date, group, institution, region, loan officer, and product filters with Submit/Clear actions, then a wide loan table with sortable/filterable financial columns and paging. AIMSCAMS renders a single as-of date, Refresh, and the generic chart-of-accounts balances table. The current local response does not contain loan-report rows or the reference filter dimensions.

## Recommendations

- Bind the route to an active-loan report API with the reference filters and columns before restructuring its table.
- Keep loan financial amounts sourced from the loan-report response.
- Compare a populated local dataset before adjusting horizontal table behavior.

Browser review was read-only; no report was exported or submitted.  
Implementation commit: none; report data contract mismatch.
