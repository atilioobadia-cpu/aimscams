# MSP08 Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP08Report\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP08Report`

## Comparison

The reference is a monthly required-liquid-assets computation marked as auto-filled from other returns. It separates available liquid assets from short-term liabilities, then shows the regulatory minimum, excess/deficiency, and minimum liquidity ratios. The schedule includes a category/amount layout, period controls, and Save/Saved Reports actions.

AIMSCAMS renders a generic chart-of-accounts balance table with a single as-of date and Refresh. None of the liquid-asset source categories, short-term liability components, derived calculations, ratio rows, or report actions are present.

## Recommendations

- Populate the schedule from the referenced returns and expose the available-asset and liability components.
- Calculate and display the required minimum, excess/deficiency, and regulatory/PEARLS ratios with clear units.
- Add monthly Submit/Clear and Save/Saved Reports actions; keep the dense category/amount table readable at the app viewport.

Read-only review; no report actions were used and no reference financial values were copied.

## Status

The local route does not implement the MSP08 monthly liquid-assets schedule or its derived calculations.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
