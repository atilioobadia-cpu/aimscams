# MSP04 Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP04Report\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP04Report`

## Comparison

The reference is a monthly financial-position form with Save/Saved Reports and reporting-date Submit/Clear. Its schedule groups loan types and shows borrower counts, outstanding amounts, and straight-line/reducing-balance weighted-average and nominal interest rates. The table is wide and uses multi-row orange headers.

AIMSCAMS displays a generic chart-of-accounts balance table with one as-of date and Refresh. The loan-type schedule, interest-rate columns, grouped headers, and report actions are absent.

## Recommendations

- Implement the monthly MSP04 schedule from loan-type and interest-rate data.
- Recreate the reference multi-row column groupings, and add reporting-date Submit/Clear and Save/Saved Reports controls.

Read-only review; no report actions were used and no reference financial values were copied.

## Status

The current route is a generic account report rather than the monthly MSP04 form.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
