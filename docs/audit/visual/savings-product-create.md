# Savings product creation visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-products-savings-create\FULL.png`  
AIMSCAMS route: `/settings/products/savings/new`

## Comparison and implementation

Reorganized the local form into the reference's Details, Terms, Savings Product Charges, and Accounting sections. Added the reference field labels and placement, and grouped the existing guarantor, collateral, multiple-account, and interest-payout flags with the term fields. Kept local Name, Product Code, Status, description, minimum balance, interest rate, and payout-frequency values editable and connected to their existing save payload.

The current savings-product contract does not persist product type, transaction bounds, permission, default auto-debit/primary-account flags, charge rules, or account/ledger mappings. Those controls are shown disabled with an explanation rather than appearing configurable when they would not save. I395 remains open until the API and persistence model support these fields and workflows.

## Browser review

Compared the full local page with `F:\Wakandi\settings-products-savings-create\FULL.png` in the visible browser at 1280×720. The long form is vertically scrollable, the document and body widths are both 1280px, and the Accounting section and Cancel/Create actions are reachable at the bottom without horizontal overflow. The browser showed empty form values; no values were entered, saved, or used to create a product.

Web production build passed. Implementation commit: pending.
