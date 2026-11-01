# Savings product creation visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-products-savings-create\FULL.png`  
AIMSCAMS route: `/settings/products/savings/new`

## Comparison

Both screens are full-page product forms. The reference separates Details, Terms, Saving Product Charges, and Accounting. It includes product type, minimum balance and transaction bounds, permission, guarantor/collateral/multiple-account/debit options, charge configuration, account name, and general-ledger mappings. AIMSCAMS provides Code, Name, Status, minimum balance, interest rate/payout frequency, description, and four availability toggles. Reference transaction limits, permissions, charges, account labels, and ledger mappings are absent, while AIMSCAMS adds explicit code/status/rate fields.

## Recommendations

- Group supported savings terms, charges, and accounting mappings into reference-style sections.
- Extend the contract before implementing fields that would affect account opening or transaction posting.
- Keep the long form responsive and maintain a fixed/reachable footer action area.

Read-only browser review; no values were entered and the product was not created. Implementation commit: none.
