# MSP10 Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP10Report\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP10Report`

## Comparison

The reference is a monthly complaints schedule. It reports opening complaints, newly received complaints, resolutions by the institution and by other parties, unresolved complaints, and referrals. The capture also shows an editable row beneath the table with horizontal overflow and bottom Cancel/submit actions, plus Save/Saved Reports at the top.

AIMSCAMS renders generic chart-of-accounts balances with a single as-of date and Refresh. Complaint categories and counts, the editable reporting row, overflow behavior, monthly Submit/Clear, and saved-report actions are absent.

## Recommendations

- Implement the complaint lifecycle categories and ensure unresolved totals follow the displayed components.
- Keep any editable row aligned with its table columns and provide usable horizontal scrolling without obscuring the bottom actions.
- Add monthly Submit/Clear and Save/Saved Reports controls.

Read-only review; no values were edited and no report actions were used.

## Status

The local route does not implement the MSP10 monthly complaints report or its edit/submit layout.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
