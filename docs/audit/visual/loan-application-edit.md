# Loan application edit visual audit

## Evidence

- Reference: `F:\Wakandi\account-loan-application-edit-39\FULL.png`.
- AIMSCAMS route: `/account-loan-application-edit/[id]`, inspected in the visible browser at 1470 × 1094 CSS px (DPR 1.0).
- The reference suffix is not a local UUID; the local API reports that a UUID is required. No application was edited.

## Reference layout

- Title card reads Update Loan Application and has a Cancel action.
- The Details accordion is collapsed; Additional Details is expanded on initial load.
- Secondary fields appear under Additional Details, with Next aligned at the lower right of the open section.

## Changes and limitations

- The shared wizard now starts edit sessions on Additional Details, uses the Update title, and sends Cancel to the application detail route. Create sessions continue to start on Details.
- The shared accordion layout and field grouping were visually checked on the create route. The edit route itself cannot be verified with the supplied numeric reference suffix because local detail endpoints require UUIDs and no matching local application row is available.
- The reference includes an interest-period and calculated-total presentation that AIMSCAMS does not currently expose. Verify the corresponding product model before adding those fields.

## Status

The shared edit layout has been aligned at code level; populated edit-state parity remains blocked by local record availability and missing product fields.
