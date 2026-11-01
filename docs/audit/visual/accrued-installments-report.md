# Accrued Installments Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-AccruedInstallmentsReport\FULL.png`  
AIMSCAMS route: `/reports-loan-AccruedInstallmentsReport`

## Comparison

The Wakandi page has a report title card with Download, a date-range preset and start/end dates, institution/group/region/loan-officer/product filters, Submit and Clear controls, and a wide sortable/filterable results grid. Its visible columns include accrued interest, paid accrued interest, and outstanding accrued interest.

AIMSCAMS shows only an as-of date and Refresh above the generic chart-of-accounts table (Code, Account, Type, Debit, Credit, Balance). The returned rows are account balances, not accrued installment records. This is a report data and filter-contract mismatch, beyond styling.

## Recommendations

- Connect the route to an accrued-installments report query and its approved fields.
- Add the reference filter and download controls once their data and permission contracts are available.
- Recheck the full grid with approved populated report data before matching its column widths and horizontal scrolling.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; report query and filter contracts are absent.
