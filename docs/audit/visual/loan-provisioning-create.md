# Loan provisioning rule creation visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-products-loan-provisioning-create\FULL.png`  
AIMSCAMS route checked: `/settings/products/provisioning-rules/new` (404)

## Comparison

The reference contains a loan provisioning rule creation state. The corresponding AIMSCAMS URL returns the framework 404 page; the local product route exposes only the provisioning-rules list. The create flow and its fields therefore have no local visual counterpart.

## Recommendations

- Add a create route only after the provisioning rule model and required classifications are agreed.
- Follow the shared Product Setup layout and preserve the validated provisioning behavior when the form exists.

Read-only browser review; no rule was created. Implementation commit: none; route is missing.
