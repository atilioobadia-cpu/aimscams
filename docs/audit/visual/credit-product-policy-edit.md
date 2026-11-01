# Credit product policy edit visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-policies-credit-product-policy-5-edit\FULL.png`  
AIMSCAMS route: `/settings/policies/credit-product/[id]/edit`

## Comparison

The reference provides expandable sections for Basic Details, Terms, Settings, Repayment, Interest, Income, Quick Loan, Loan Stages, and Accounting Setting, with ledger fields and a persistent bottom action area. AIMSCAMS now renders the same section hierarchy, three-column accounting grid, and reachable Save Changes/Cancel footer. At 1280×720, document/body widths are both 1280px.

The local `VISUAL-QA-CPP` draft populates Code, Name, Status, and Description. Typed lending terms and account mappings are disabled because the local contract cannot persist them; the flexible JSON payload is retained in a separate collapsed section. An invalid numeric reference ID previously appeared as a blank editable form because the load failure was silently swallowed. It now shows a clear invalid-ID state with a return link.

## Recommendations

- Add typed, persisted loan terms and accounting mappings before enabling the corresponding fields.
- Keep the current draft marked as synthetic; do not use it for live lending configuration.

Read-only edit review; no fields were changed or saved.
