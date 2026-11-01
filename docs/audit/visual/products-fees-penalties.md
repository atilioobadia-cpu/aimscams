# Fees and penalties visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-products-fee-penalties\FULL.png`  
AIMSCAMS route: `/settings/products/fee-penalties`

## Comparison

The local list now uses the shared Product Setup title/tabs, outlined Add Charge action, compact search/Add Filters toolbar, table column menu, and reference columns Account Number, Charge Name, Charge Type, General Ledger Code, Tax Rates, and Tax Inclusive. At 1280×720 the page has no horizontal overflow. The reference has four rows; the local organization has no fee or penalty records.

Opened Add Charge in the visible browser and compared it with the reference modal without entering or saving data. The local modal now uses a Details title and reference-aligned Charge Name, Charge Type, and General Ledger Code labels. AIMSCAMS retains additional Code, Amount Type/Amount, Status, and Description fields needed by its current fee model. The schema has no Account Number, Tax Rates, or Tax Inclusive fields; rows show N/A for those values. The GL account control is still free text rather than an account selector.

## Recommendations

- Add account selection, tax-rate associations, tax-inclusive behavior, and account-number relations to the fee model before replacing N/A fields.
- Use a searchable ledger-account selector for General Ledger Code; preserve current amount and validation rules until the contract changes.
- Populate records only through verified local/test fixtures; reference charge rows are not copied.

The Add Charge dialog was opened and closed with Cancel. No fee or penalty was created or changed. Web production build passed. Implementation commit: pending.
