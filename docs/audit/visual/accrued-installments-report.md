# Accrued Installments Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-AccruedInstallmentsReport\FULL.png`  
AIMSCAMS route: `/reports-loan-AccruedInstallmentsReport`

## Comparison

The Wakandi page has a report title card with Download, a date-range preset and start/end dates, institution/group/region/loan-officer/product filters, Submit and Clear controls, and a wide sortable/filterable results grid. Its visible columns include accrued interest, paid accrued interest, and outstanding accrued interest.

AIMSCAMS shows only an as-of date and Refresh above the generic chart-of-accounts table (Code, Account, Type, Debit, Credit, Balance). The returned rows are account balances, not accrued installment records. This is a report data and filter-contract mismatch, beyond styling.

## AIMSCAMS changes

- Removed the unrelated Chart of Accounts request and table from this loan-report route.
- Added the screenshot-based title/download card, date preset and range controls, portfolio filter row, submit/clear actions, sortable/filter-style column affordances, and horizontally scrollable result register.
- Added the three reference fields for accrued, paid accrued, and outstanding accrued interest.
- Kept the result state empty because AIMSCAMS has no accrued-installments query. Portfolio filter choices remain unavailable rather than being fabricated.

## Measurement and verification

Compared the saved Wakandi capture against the route in the visible Chrome session. The local browser showed the date/filter controls and three report columns in order. SSO reCAPTCHA remained unavailable, so exact live DevTools CSS values could not be checked. No report query, export, or Wakandi action was submitted; the local CSV action exports the report headings only while no data endpoint exists.
