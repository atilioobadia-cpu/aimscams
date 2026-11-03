# Summarized Portfolio at Risk Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-SummarizedPortfolioAtRiskReport/FULL.png`  
AIMSCAMS route: `/SummarizedPortfolioAtRiskReport`

## Comparison

The reference provides an as-of date and institution/region/loan-officer/product filters with Submit/Clear and Download. Its visible columns include outstanding penalty, overdue penalty, total outstanding, total overdue, and portfolio at risk; a row and totals are populated.

AIMSCAMS displays an as-of date, Refresh, and the generic chart-of-accounts balances (Code, Account, Type, Debit, Credit, Balance). The report-specific filters and loan rows are absent.

## Recommendations

- Expose the as-of and portfolio filters, map the summary measures, and define the portfolio-at-risk numerator, denominator, and aggregation rules. Reconcile the summary against underlying loan records.
- Match the reference title card, compact filters, wide sortable table, and horizontal-scroll treatment while following the AIMSCAMS UI contract.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; Summary report query and PAR formula are not specified locally.

## Implementation update (2026-11-03)

Replaced the generic accounting balance page with the shared loan report title/download card, date/filter toolbar, Submit/Clear actions, and horizontally scrollable table. Added report-specific columns based on the saved reference notes. Results are empty because a matching local report endpoint is unavailable; no Wakandi rows were copied. The AIMSCAMS route was checked in visible Chrome. Live Wakandi DevTools dimensions remain unverified while SSO reCAPTCHA blocks login.
