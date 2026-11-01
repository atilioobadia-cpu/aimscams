# Fees and penalties visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-products-fee-penalties\FULL.png`  
AIMSCAMS route: `/settings/products/fee-penalties`

## Comparison

The reference screenshot captures Product Setup with the Fee & Penalties tab active and an Add Charge dialog open. The modal fields are Charge Name, Charge Type, General Ledger Code, and Tax Rates. AIMSCAMS list route uses a standalone heading, search, Kind and Status filters, and no Product Setup tabs. The captured reference is a different interaction state from the default local page, so dialog geometry cannot be scored from the local capture.

## Recommendations

- Put the fee/penalty page in the shared Product Setup tab shell.
- Compare the create dialog in a matching state and ensure charge fields map to supported local fee data.

Read-only browser review; no charge dialog was opened, and no fee or penalty was saved. Implementation commit: none.
