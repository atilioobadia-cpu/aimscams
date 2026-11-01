# Loan guarantors visual audit

Date: 2026-11-01
Reference: `F:\Wakandi\account-loan-details-118-guarantors\FULL.png`
AIMSCAMS route: `/account-loan-details/[id]/guarantors`

## Comparison

The reference capture shows the loan header and tabs with an Add New Guarantor modal open over a populated guarantor table. The dialog includes guarantor type, account details, guarantee type/value, and blocked-fund controls. AIMSCAMS renders a standalone Guarantors and collateral heading; the supplied numeric reference suffix triggers “Validation failed (uuid is expected)” before the detail/table content loads. No local loan rows or guarantors are available. Reference names and account values are omitted.

## Recommendations

- Preserve the shared loan header and active Guarantors tab.
- Compare both the table and create dialog after a local loan record and guarantor contract are available.
- Keep account and block-fund data linked to validated records; do not infer values from the reference capture.

Read-only browser review; no guarantor was added or changed.
Implementation commit: none; populated state and dialog comparison await a local UUID loan.