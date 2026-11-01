# Account loans list visual audit

## Evidence

- Reference: `F:\Wakandi\account-loan\FULL.png` (1838 × 1241 pixels; calibrated DPR 1.0, 1838 × 1241 CSS px).
- AIMSCAMS: `/account-loan`, inspected visibly at 1470 × 1094 CSS px in the current in-app browser.

## Shared shell comparison

- Local header: 76px; expanded sidebar: 240px; collapsed sidebar: 76px.
- The reference screenshot at DPR 1 uses the same 76px header and 240px sidebar.
- The local page uses a smaller CSS viewport than the reference capture, so content width and wrapping
  are not directly scored in this inspection.

## Observed page differences

1. The reference has a title card, then Active / New / Closed tabs with Closed selected. AIMSCAMS
   still has a breadcrumb, explanatory text and a Status dropdown.
2. The reference toolbar shows Search, Loan Officer, Add filters, and saved-filter actions. AIMSCAMS
   shows Search and Status.
3. The reference has a populated horizontally scrolling table and pager. The local API currently
   returns no loan rows, so row density, pagination values, and row controls cannot be compared.
4. The shared table header and row spacing were adjusted using the Clients reference. Loan row styling
   still needs a populated non-production record to verify in the browser.

## Status

The shared shell geometry is measured; Loans page structure and data state still differ. No loan data
was seeded, changed, or copied from the reference.
