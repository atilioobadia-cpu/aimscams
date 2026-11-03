# Paid Off Loans Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-PaidOffLoansReport/FULL.png`  
AIMSCAMS route: `/PaidOffLoansReport`

## Comparison

The reference provides a last-30-days date range, loan officer/product/institution/region/group filters, and Download. Its wide table includes loan date, expiry date, principal paid, interest paid, and total paid; the capture is an empty state.

AIMSCAMS displays an as-of date, Refresh, and the generic chart-of-accounts balances (Code, Account, Type, Debit, Credit, Balance). The report-specific filters and loan rows are absent.

## Recommendations

- Add a paid-off-loan query with the date and portfolio filters, map the paid principal/interest/total and loan dates, then implement paging and export from confirmed report data.
- Match the reference title card, compact filters, wide sortable table, and horizontal-scroll treatment while following the AIMSCAMS UI contract.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; Paid-off-loan query/filter/export contract missing.

## Implementation update (2026-11-03)

Replaced the unrelated generic accounting balance page with the shared loan report title/download card, date/filter toolbar, Submit/Clear actions, and horizontally scrollable table. Added report-specific columns based on the saved reference notes. Results are empty because a matching local report endpoint is unavailable; no Wakandi rows were copied. Checked the visible AIMSCAMS page. Wakandi live DevTools dimensions are unverified because SSO reCAPTCHA blocks the session.
