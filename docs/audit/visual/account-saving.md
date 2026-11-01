# Savings accounts visual audit

## Evidence

- Reference: `F:\Wakandi\account-saving\FULL.png` (list with Details modal open).
- AIMSCAMS: `/account-saving`, inspected in the visible browser at 1470 × 1094 CSS px (DPR 1.0); the New saving modal was opened without submitting.
- No account was created and no reference account values were copied.

## Matched structure

- Replaced the breadcrumb/description title with a Savings title card and outline New saving action.
- Kept the list table visible when the local list has no rows, so the empty state retains its column header structure.
- Aligned the modal width to the content area and changed its heading, action label, and Client/Member and Product labels to match the reference.
- The browser showed no console errors or warnings.

## Remaining differences

1. AIMSCAMS stores Account type and optional Account number. The reference form shows Account Name. The local account model has no account-name field, so the form keeps its actual supported fields rather than presenting a value it cannot save.
2. The local list has no accounts. Row content, status colors, filter-menu behavior, and pagination cannot be compared from the empty local state.
3. The reference capture has its modal open; the local page keeps it closed by default and opens it through New saving, which preserves normal page entry behavior.

## Status

The title/action card, list shell, empty table structure, modal proportions, and supported form labels align. Account-name parity and data-dependent row states remain open.

## 2026-11-01 re-review

Compared the live Wakandi Savings list and `F:\Wakandi\account-saving\FULL.png`. The AIMSCAMS list now follows the visible reference columns: Account Number, Member ID, Member Name, Product, Type, Creation Date, Status, and Actions. It uses the existing account number, client reference, client name, product, account type, created date, and status fields; the extra Balance column was removed.

The toolbar now has Product and Status filter popovers with Condition `Is`, Value, Clear, and Apply controls, plus Add Filters options for Account Number, Member ID, Member Name, and Type. Product filtering and status filtering were exercised in the visible local browser; Clear filters restored the empty default state. No account records were created and no Wakandi data was copied.

The reference Details form includes Account Name. AIMSCAMS has account type and account number fields but no account-name field, so exact form data parity remains blocked on a model decision. The local account list is empty, so populated row styling and row actions remain unverified.
