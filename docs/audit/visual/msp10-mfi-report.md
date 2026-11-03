# MSP10 MFI Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP10MFIReport\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP10MFIReport`

## Comparison

The reference is a quarterly geographic distribution schedule for branches, employees, compulsory savings, and loans by age and sex. The nested headers distinguish borrower counts, loan counts, and outstanding balances, including female/male splits for up-to-35 and above-35 cohorts. Geography totals and council categories follow the main rows. It has year/quarter selectors and Save/Saved Reports and Submit/Clear actions.

AIMSCAMS uses the generic chart-of-accounts balance report with a single as-of date and Refresh. The quarterly controls, geographic hierarchy, compulsory-savings measure, demographic loan and borrower breakdowns, and report actions are missing.

## Recommendations

- Implement the quarterly geography rollup and the compulsory-savings, borrower, loan, and outstanding-balance measures.
- Retain the reference's multi-level column groups, totals, and council categories in a usable wide-table layout.
- Add year/quarter Submit/Clear and Save/Saved Reports controls.

Read-only review; no report actions were used and no reference financial values were copied.

## Status

The local route does not implement the MSP10 MFI geographic distribution schedule.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
