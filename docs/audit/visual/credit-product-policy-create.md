# Create credit product policy visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-policies-credit-product-policy-5-edit\FULL.png` and the captured policy detail states in `settings-policies-credit-product-policy-5/`.  
AIMSCAMS route: `/settings/policies/credit-product/new`

## Comparison

The create form now follows the reference's accordion hierarchy: Basic Details, Terms, Settings, Repayment, Interest, Income, Quick Loan, Loan Stages, and Accounting Setting. The accounting section uses the reference's six-column mapping layout, and the bottom Cancel/Create actions remain reachable. At 1280×720, the document and body widths are both 1280px with no horizontal overflow.

The current policy API persists Code, Name, Status, Description, and flexible JSON content only. Loan type, domain terms, accounting mappings, and approval workflow are not typed or persisted. Unsupported reference fields are visibly disabled; the existing JSON editor remains under a collapsed AIMSCAMS Policy Payload section. I388 remains open for the policy model and workflow gap.

## Recommendations

- Add typed/versioned lending terms, accounting mappings, and validation to the credit policy model before enabling the disabled reference fields.
- Provide persisted approval state and assignment history for the reference approval sections.
- Keep policy terms institution-owned; do not infer or copy financial values from screenshots.

The create form was reviewed at 1280×720 before a clearly labeled local visual-QA draft was created (`VISUAL-QA-CPP`, no lending terms or ledger mappings). This synthetic record enables populated detail/edit route review; it is explicitly marked as not a financial product configuration. Create-form implementation commit: `1cc44ff`.
