# Create credit product policy visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-policies-credit-product-policy-5-edit\FULL.png` and the captured policy detail states in `settings-policies-credit-product-policy-5/`.  
AIMSCAMS route: `/settings/policies/credit-product/new`

## Comparison

AIMSCAMS currently exposes a basic form for Code, Name, Status, Description, and a raw Policy content (JSON) textarea. The reference policy details use domain sections and tabs for Terms, Settings, Interest, Repayments, Guarantors and Collateral, Loan Charges, Loan Stages, and Accounting Setting; additional reference sections show approval status, stage approvers, and an approval list. This is a major contract and workflow difference, not just spacing or color.

## Recommendations

- Replace the generic JSON editor with structured policy fields and the reference section/tab hierarchy as the lending policy model supports it.
- Provide visible approval state and assignment history from persisted policy data.
- Keep these financial terms versioned and validate before saving; do not copy values from reference screenshots into AIMSCAMS.

Read-only browser review; no policy values were entered or saved. Implementation commit: none.
