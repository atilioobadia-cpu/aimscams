# Savings product edit visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-products-savings-edit-1\FULL.png`  
AIMSCAMS route: `/settings/products/savings/[id]` (no local product record available)

## Comparison

The reference edit form contains Basic Details, Terms, Savings Product Charges, and Accounting sections, including transaction limits, permission, debit/primary-account controls, charges, and ledger mappings. AIMSCAMS has no savings products in its list, so no matching populated edit state can be loaded. The local create form exposes only a subset of the reference fields; edit-state parity is therefore unverified and the missing fields are a known contract gap.

## Recommendations

- Provide an edit route for persisted savings products using the same grouped terms, charge, and accounting fields as creation.
- Preserve configured values and verify validation without altering existing products during visual QA.

Read-only browser review; no product was changed. Implementation commit: none; no local edit record exists.
