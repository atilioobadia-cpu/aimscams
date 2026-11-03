# MSP11 Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP11Report\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP11Report`

## Comparison

The reference shows regulatory monthly deposits and loans exposure.

AIMSCAMS renders the generic chart-of-accounts balance table with an as-of date and Refresh. The reference instead presents aggregate bank/deposit/loan exposure totals, an institution-level detail schedule, and edit/save/submit/clear controls.

## Recommendations

- Implement the monthly financial-institution exposure schedule with aggregate totals and institution rows.
- Match the reference period controls, editable rows, and Save/Saved Reports/Submit/Clear actions.
- Keep the empty state and totals when no institution data is available.

Read-only review; no report filters were submitted and no exports were started. No reference personal or financial values were copied.

## Status

The current route does not implement the reference report structure and data contract.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
