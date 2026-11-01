# Credit product policy edit visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-policies-credit-product-policy-5-edit\FULL.png`  
AIMSCAMS route: `/settings/policies/credit-product/[id]/edit` (sample record not found)

## Comparison

The reference provides expandable sections for Basic Details, Terms, Settings, Repayment, Interest, Income, Quick Loan, Loan Stages, and Accounting Setting, with ledger fields and a persistent bottom action area. AIMSCAMS has a raw JSON textarea on creation and no matching local detail record for the edit route. This leaves the reference's structured populated edit state unavailable.

## Recommendations

- Use typed sections for loan terms and accounting mappings instead of editing opaque JSON.
- Keep the long form's section headers, spacing, validation feedback, and footer actions consistent with the reference.

Read-only browser review; no policy values were entered or updated. Implementation commit: none; no local policy record exists.
