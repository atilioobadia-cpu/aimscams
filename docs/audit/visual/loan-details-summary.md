# Loan details summary visual audit

## Evidence

- Reference: `F:\Wakandi\account-loan-details-118-summary\FULL.png`.
- AIMSCAMS: `/account-loan-details/[id]`, inspected in the visible browser at 1470 × 1094 CSS px (DPR 1.0).
- The supplied numeric reference suffix returns an API UUID validation error locally. The local Loans list has no rows; no loan data was changed.
- Reference member and staff values are omitted from this note.

## Comparison

Wakandi shows a compact loan summary card, a horizontal tab row, summary/action controls, balance tables, disbursement information, guarantors, and collateral. AIMSCAMS currently has a plain title and status row followed by a limited summary grid and separate document, guarantor, transaction, and repayment links. The Schedule navigation is now present, but the supplied state cannot load locally.

## Status

The populated visual comparison is blocked by the empty local loan list and UUID-only route contract. A shared loan header/tab layout and the underlying summary fields need a dedicated pass once a local representative loan exists.
