# MSP07 Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP07Report\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP07Report`

## Comparison

The reference is a monthly geographic distribution schedule for branches, employees, and loans by borrower age and sex. Nested columns distinguish borrower counts, loan counts, and outstanding loan amounts for female and male borrowers up to and above age 35. It also includes geography rows, totals, validation, and council-category rows beneath the main schedule.

AIMSCAMS shows the generic chart-of-accounts balance report with an as-of date and Refresh. The report identity and title card, Save/Saved Reports, Submit/Clear, wide grouped header structure, geographic breakdown, validation rows, and demographic measures are missing.

## Recommendations

- Build the geographic hierarchy and nested sex/age measures with distinct counts and outstanding balances.
- Preserve the reference's multi-level headers, total/validation rows, and council categories in a horizontally usable table.
- Add monthly reporting and saved-report controls.

Read-only review; no report actions were used and no reference financial values were copied.

## Status

The local route does not implement the MSP07 geographic and demographic reporting schedule.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
