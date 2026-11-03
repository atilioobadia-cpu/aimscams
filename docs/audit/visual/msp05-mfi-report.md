# MSP05 MFI Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP05MFIReport\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP05MFIReport`

## Comparison

The reference is a quarterly required-liquid-assets calculation. It has year/quarter selectors, Submit/Clear, Save/Saved Reports, an available-liquid-assets schedule, a minimum requirement, and calculated total-assets, excess/deficiency, and liquid-asset-ratio rows.

AIMSCAMS shows the generic chart-of-accounts balance table with a single as-of date and Refresh. The liquid-assets components, required minimum calculation, ratio rows, quarterly controls, and save/report actions are absent.

## Recommendations

- Implement the liquid-assets input schedule and derived totals/ratio from a dedicated regulatory report source.
- Add year/quarter controls and Save/Saved Reports actions.

Read-only review; no report actions were used and no reference financial values were copied.

## Status

The local route does not implement the MSP05 MFI schedule or calculation.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
