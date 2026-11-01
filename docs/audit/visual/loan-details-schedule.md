# Loan repayment schedule visual audit

## Evidence

- Reference: `F:\Wakandi\account-loan-details-118-schedule\FULL.png`.
- AIMSCAMS: `/account-loan-details/[id]/schedule`, inspected in the visible browser at 1470 × 1094 CSS px (DPR 1.0).
- The Schedule route did not exist before this pass. The reference numeric suffix now opens the route, but the API rejects it because local loan IDs must be UUIDs. No loan data was changed.

## Changes

- Added the missing Schedule route using the existing read-only `getLoan` schedule response.
- Added a Schedule link from the loan summary, horizontal loan-detail navigation, a status filter, and CSV download from the rows returned by AIMSCAMS.
- The browser confirms the route now renders the AIMSCAMS application shell and its local UUID error instead of a 404. No console errors or warnings were recorded.

## Remaining differences

The reference includes transaction number, payment, charges, paid, waived-off, and balance values that are absent from the local schedule response. AIMSCAMS currently displays only the installment data its API provides; no missing financial values are inferred.

## Status

The missing route and navigation are implemented. Populated table comparison and unsupported financial columns remain blocked by local data and API fields.
