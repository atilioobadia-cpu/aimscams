# MSP03 Type 2 Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-msp-MSP03Type2Report\FULL.png`  
AIMSCAMS route: `/reports-msp-MSP03Type2Report`

## Comparison

The reference is the Type 2 quarterly sector/sub-sector loan classification and provisioning schedule. It includes the same reporting date, Submit/Clear and Save/Saved Reports controls as Type 1, followed by sector totals, borrower counts, current and past-due buckets, write-offs, provisions, collateral offsets, and a classification-rate appendix. Its schedule uses a distinct Type 2 classification state.

AIMSCAMS shows the generic chart-of-accounts balance report with an as-of date, Refresh, and Code/Account/Type/Debit/Credit/Balance columns. It has no sector hierarchy, loan aging buckets, provision calculations, or Type 2 report controls/data.

## Recommendations

- Implement a dedicated Type 2 report contract and schedule, preserving its classification buckets and totals independently from Type 1.
- Provide the reporting date Submit/Clear and Save/Saved Reports controls.

Read-only browser review; no report was submitted, saved, or exported. Reference financial values were not copied.

## Status

Type 2 currently renders the generic account report and has no distinct regulatory schedule.

## Implementation update (2026-11-04)

Replaced the generic Chart of Accounts screen with a dedicated regulatory schedule layout: reporting-period selectors, Submit/Clear, Saved Reports/Save affordances, grouped schedule sections, comparative or sector measure columns, and horizontal scrolling. Values are blank because the local regulatory report service is not available; saved-report controls are disabled to avoid claiming persistence. No Wakandi values were copied. Local route verified in visible browser; live Wakandi DevTools remained unavailable due to SSO reCAPTCHA.
