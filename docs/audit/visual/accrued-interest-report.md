# Accrued Interest Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-AccruedInterestReport\FULL.png`  
AIMSCAMS route: `/reports-loan-AccruedInterestReport`

## Comparison

The Wakandi page has the same report shell as the neighboring loan reports: title card with Download, date-range preset and start/end dates, institution/group/region/loan-officer/product filters, and Submit/Clear actions. Its wide sortable/filterable grid includes outstanding accrued interest, outstanding principal, and outstanding interest amounts.

AIMSCAMS provides only an as-of date and Refresh, then reuses the chart-of-accounts balance table with Code, Account, Type, Debit, Credit, and Balance columns. Account balances do not represent the accrued-interest fields shown in the reference.

## Recommendations

- Provide a dedicated accrued-interest query and field mapping.
- Add the reference filters and export action using the report’s approved contract.
- Compare a permitted populated response before tuning the wide grid layout.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; report query and filter contracts are absent.
