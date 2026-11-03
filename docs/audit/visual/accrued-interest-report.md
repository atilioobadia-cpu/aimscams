# Accrued Interest Report visual audit

Date: 2026-11-03
Reference: `F:\Wakandi\reports-loan-AccruedInterestReport\FULL.png`
AIMSCAMS route: `/reports-loan-AccruedInterestReport`

## AIMSCAMS changes

- Replaced the unrelated Chart of Accounts balance table with the shared accrued-loan report shell: title/download card, date range, portfolio filters, submit/clear controls and wide sortable/filterable register.
- Added the reference fields: Outstanding Accrued Interest Amount, Outstanding Principal Amount, and Outstanding Interest Amount.
- Kept results empty because the local accrued-interest report endpoint is absent. Disabled portfolio selectors communicate the unsupported local filter dimensions.

## Measurement and verification

Used the saved Wakandi capture and visible local Chrome route for structure and column ordering. Exact live DevTools measurements remain unavailable during the Wakandi SSO reCAPTCHA failure. No report data or production information was changed. Download exports only the known column headings while data is unavailable.
