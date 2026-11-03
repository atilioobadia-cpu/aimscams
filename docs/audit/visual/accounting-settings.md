# Accounting settings visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-accounting-settings\FULL.png`  
AIMSCAMS route: `/settings/accounting`

## Reference and local comparison

The reference uses an Accounting title card and an Inter Branch Setting tab with a tax-rate list/search and an Add Tax Rates dialog. The dialog groups rate name, code, description, active status, and one or more tax components with rate and ledger code. AIMSCAMS has been updated to use the reference title card and tab label. The page still shows statutory tax rate and inter-branch ledger controls, a Fiscal periods table, and a Posting policies section rather than the reference tax-rate catalog.

The saved screenshot is the reference source. Wakandi live F12 values were unavailable because the current session is stopped at SSO.

## Remaining gaps

- Add a tax-rate catalog and component editor backed by a dedicated tax-rate model; the API currently stores only one organisation tax percentage and an inter-branch flag.
- Move local fiscal-period and posting-policy workflows into clearly separate AIMSCAMS sections after the reference tab content.
