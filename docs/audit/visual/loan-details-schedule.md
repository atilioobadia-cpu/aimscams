# Loan repayment schedule visual audit

## Evidence

- Reference: `F:\Wakandi\account-loan-details-118-schedule\FULL.png`.
- AIMSCAMS: `/account-loan-details/[id]/schedule`, inspected in the visible browser at 1470 × 1094 CSS px (DPR 1.0).
- The canonical Schedule route is `/account-loan-details/[id]/schedule`. The screenshot folder suffix is a reference identifier, not a local loan ID. The visible browser rendered the route and its “Loan repayment schedule” heading. A populated comparison still needs a local UUID loan with schedule data. No loan data was changed.

## Changes

- The existing Schedule route uses the read-only `getLoan` schedule response.
- Added a Schedule link from the loan summary, horizontal loan-detail navigation, a status filter, and CSV download from the rows returned by AIMSCAMS.
- Visible browser check confirmed the page title and route. The audit fixture ID was not a real local loan ID, so populated row comparison remains pending.

## Remaining differences

The reference includes transaction number, payment, charges, paid, waived-off, and balance values that are absent from the local schedule response. AIMSCAMS currently displays only the installment data its API provides; no missing financial values are inferred.

## Status

Route and navigation exist. Populated table comparison and unsupported financial columns remain pending local data and API fields.
