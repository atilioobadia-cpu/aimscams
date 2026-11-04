# Active Loan Report visual audit

Date: 2026-11-03
Reference: `F:\Wakandi\reports-loan-ActiveLoanReport\FULL.png` and capture 01
AIMSCAMS route: `/reports-loan-ActiveLoanReport`

## AIMSCAMS changes

- Removed the Chart of Accounts query/table from this loan report.
- Applied the shared loan-report title/download card, single as-of date, group/branch/region/loan-officer/product filters, Submit and Clear actions, and wide horizontally scrollable result table.
- Added reference column headings, including account/member identity and loan balance/delinquency fields. No Wakandi member names, IDs, or financial values were copied.
- Kept the local report empty because an active-loan report API is not available. Portfolio selector options are loaded from local read-only catalogs; the report data endpoint remains unavailable.

## Measurement and verification

Compared the available reference screenshots with the AIMSCAMS page in the visible Chrome session. Wakandi DevTools values were not captured while SSO reCAPTCHA was unavailable. No report filters were submitted to Wakandi and no data was changed.

- Enabled the branch, group, region, loan officer, and product selectors from local read-only catalogs to match the reference toolbar. The report data endpoint remains unavailable, so the result table stays empty and selections cannot query report rows yet.

## Filter alignment update (2026-11-04)

- Enabled the available local catalog-backed filter controls. Reference captures show these controls enabled.
- Live Wakandi measurements remain unverified; the saved reference capture is dated 2026-10-29.
- The local active-loan report endpoint is still missing, so filter submissions cannot return report rows.
