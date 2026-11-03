# MSP06 Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP06Report\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP06Report`

## Comparison

The reference is a monthly related-party lending schedule. It includes reporting-period controls, Save/Saved Reports actions, and columns for related-party category, number of loans, loan amount, and savings/deposits/voluntary shares securing the loans, followed by totals.

AIMSCAMS renders the generic chart-of-accounts balance table with a single as-of date and Refresh. The related-party schedule, total row, monthly Submit/Clear controls, and saved-report actions are absent.

## Recommendations

- Provide the related-party loan categories and counts, amounts, and guarantee-source fields in the reference's compact four-column schedule.
- Add the reporting-date Submit/Clear and Save/Saved Reports controls.
- Use a deliberate empty state when no report data is available.

Read-only review; no report actions were used and no reference financial values were copied.

## Status

The local route does not implement the MSP06 related-party schedule or its monthly reporting workflow.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
