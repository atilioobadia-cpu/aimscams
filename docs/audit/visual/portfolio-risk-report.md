# Portfolio Risk Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-PortfolioRiskReport/FULL.png`  
AIMSCAMS route: `/PortfolioRiskReport`

## Comparison

The reference has an as-of date and institution/group/loan-officer/product filters. Its wide table contains arrears, arrears rate, risk percentage, and last repayment amount; the capture shows a populated row and total.

AIMSCAMS displays an as-of date, Refresh, and the generic chart-of-accounts balances (Code, Account, Type, Debit, Credit, Balance). The report-specific filters and loan rows are absent.

## Recommendations

- Add portfolio-risk calculations and an as-of query. Validate risk-rate definitions, row grouping, and total reconciliation against approved accounting and credit rules before displaying values.
- Match the reference title card, compact filters, wide sortable table, and horizontal-scroll treatment while following the AIMSCAMS UI contract.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; Portfolio-risk data source and risk calculation rules missing.

## Implementation update (2026-11-03)

Replaced the unrelated generic accounting balance page with the shared loan report title/download card, date/filter toolbar, Submit/Clear actions, and horizontally scrollable table. Added report-specific columns based on the saved reference notes. Results are empty because a matching local report endpoint is unavailable; no Wakandi rows were copied. Checked the visible AIMSCAMS page. Wakandi live DevTools dimensions are unverified because SSO reCAPTCHA blocks the session.
