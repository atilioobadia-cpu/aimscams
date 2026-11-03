# Written-Off Loan Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-WrittenOffLoanReport/FULL.png`  
AIMSCAMS route: `/WrittenOffLoanReport`

## Comparison

The reference provides a last-30-days range and institution/region/group/product filters with Submit/Clear. The wide table includes write-off reason and date, initiator, and recovered amount from written-off principal; the capture is empty.

AIMSCAMS displays an as-of date, Refresh, and the generic chart-of-accounts balances (Code, Account, Type, Debit, Credit, Balance). The report-specific filters and loan rows are absent.

## Recommendations

- Add a read-only write-off report query with the reference filters and recovery fields. Confirm permissions for initiator details and use append-only ledger write-off and recovery records as the source.
- Match the reference title card, compact filters, wide sortable table, and horizontal-scroll treatment while following the AIMSCAMS UI contract.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; Write-off report source and access contract missing.

## Implementation update (2026-11-03)

Replaced the generic accounting balance page with the shared loan report title/download card, date/filter toolbar, Submit/Clear actions, and horizontally scrollable table. Added report-specific columns based on the saved reference notes. Results are empty because a matching local report endpoint is unavailable; no Wakandi rows were copied. The AIMSCAMS route was checked in visible Chrome. Live Wakandi DevTools dimensions remain unverified while SSO reCAPTCHA blocks login.
