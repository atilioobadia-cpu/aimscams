# Loan product details visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-products-loan-5\FULL.png`  
AIMSCAMS route: `/settings/products/loan/5`

## Comparison

The reference is a populated read-only loan product detail. It has a summary header with status, name, description, and loan type, followed by Terms, Settings, Interest, Income, Repayments, Guarantors and Collateral, Loan Product Charges, Loan Product Stages, Accounting Settings, and History.

The visible AIMSCAMS route returns “Loan product not found.” I also opened the loan product list, which reports that no loan products are configured for the organization. The local route/API requires a UUID, while the supplied capture uses the sample product route ending in `5`. The existing loan-product API exposes list, get, and limited status/name update operations; it has no product creation operation. The local model also lacks several reference fields and supporting charge/stage/account relationships.

## Browser review

Reviewed `/settings/products/loan/5` and `/settings/products/loan` in the visible browser. The list empty state and detail not-found state are consistent. No product was created or edited, and no reference terms or ledger values were copied into the local system.

## Remaining gaps

- Add the complete loan-product contract and a governed creation workflow before attempting to render all reference sections.
- Provide clearly isolated, inactive synthetic products for local UI review through an approved API or seed path.
- Resolve the sample product route to a local UUID record through the list/detail navigation rather than relying on the reference numeric suffix.

The detail layout cannot be verified against a populated local record; the API and schema gaps remain tracked in I383 and I396.
