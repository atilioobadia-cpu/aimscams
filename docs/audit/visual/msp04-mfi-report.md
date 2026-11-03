# MSP04 MFI Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP04MFIReport\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP04MFIReport`

## Comparison

The reference is a quarterly microfinance loan interest-rate schedule. It has year/quarter selectors, Submit/Clear, Save/Saved Reports, and a table grouped by loan type with borrower counts, outstanding loan amounts, and weighted-average and nominal interest-rate columns for straight-line and reducing-balance amortization.

AIMSCAMS shows the generic chart-of-accounts report with one as-of date, Refresh, and Code/Account/Type/Debit/Credit/Balance. Loan categories, rate measures, quarterly controls, and report actions are absent.

## Recommendations

- Add the quarterly loan-type/rate schedule using the dedicated interest-rate statistics source.
- Match the nested rate columns and year/quarter selection controls.
- Provide Save/Saved Reports actions for this regulatory form.

Read-only review; no report actions were used and no reference financial values were copied.

## Status

The local report is not connected to the MSP04 MFI contract.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
