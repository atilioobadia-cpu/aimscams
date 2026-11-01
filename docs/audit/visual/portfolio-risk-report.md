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
