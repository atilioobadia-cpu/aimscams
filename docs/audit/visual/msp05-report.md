# MSP05 Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP05Report\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP05Report`

## Comparison

The reference is a monthly loan-disbursement schedule grouped by sector and sub-sector. It has a reporting-date Submit/Clear row, Save/Saved Reports actions, and paired borrower-count/amount columns for female, male, and total disbursements.

AIMSCAMS renders the generic chart-of-accounts balance table with a single as-of date and Refresh. The sector hierarchy, sex-disaggregated counts and amounts, and report actions are missing. The reference's current capture has the column header structure without visible detail rows.

## Recommendations

- Bind the page to monthly disbursement and sector/sub-sector data with male/female totals.
- Add reporting-date Submit/Clear and Save/Saved Reports actions.
- Preserve the wide table's grouped headers and empty state when report rows are unavailable.

Read-only review; no report actions were used and no reference financial values were copied.

## Status

The route does not implement the MSP05 disbursement report data or structure.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
