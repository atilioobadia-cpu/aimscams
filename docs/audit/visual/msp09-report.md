# MSP09 Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP09Report\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP09Report`

## Comparison

The reference is a monthly capital-adequacy computation. A particulars/amount schedule groups core capital, institutional capital, net institutional capital, total assets, and capital-adequacy ratios. The page also has reporting-period controls and Save/Saved Reports actions.

AIMSCAMS renders the generic chart-of-accounts balance table with a single as-of date and Refresh. The capital components, derived totals and ratios, monthly Submit/Clear controls, and saved-report actions are absent.

## Recommendations

- Add the reference's capital categories and data sources, including clearly labeled computed totals.
- Calculate and display the required capital ratios against total assets.
- Provide the monthly reporting controls and saved-report actions.

Read-only review; no report actions were used and no reference financial values were copied.

## Status

The local route does not implement the MSP09 monthly capital-adequacy schedule or calculations.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
