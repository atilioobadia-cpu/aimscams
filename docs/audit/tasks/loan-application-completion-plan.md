# Loan application workflow completion plan

State: `IN_PROGRESS`

Goal: finish the AIMSCAMS Create Loan Application workflow without claiming UI fields are persisted when the API/model does not support them.

## Current evidence

- Route: `/account-loan-application-create` renders `LoanApplicationWizard` in `apps/web/src/components/accounts/loan-application-wizard.tsx`.
- The model now persists multiple next-of-kin, guarantor, and collateral entries in JSONB, plus insider relationship; create/update parsing, validation, and response serialization include these values.
- Submitted applications require a document in both the UI and API; drafts may be saved without one. Existing document metadata is shown when editing.
- The local wizard has seven sections: Details, Additional Details, Next of Kin, Guarantors, Collaterals, Payment Destination, and Loan Documents.
- The live reference currently shows five sections before selections. Conditional sections could not be confirmed: the client typeahead opened, but an unsaved client selection did not complete. No live form was saved or submitted.
- Loan-product configuration still does not model guarantor minimums or collateral requirements/types/ratios. The UI's two-guarantor rule is a fixed fallback, not a product-specific rule.
- The shared domain schedule is used and displayed in integer minor units. A blank installment date defaults to one month from today; the preview does not model grace-period treatment. Do not adjust installments to match an external example when it differs by a cent; preserve the shared rounding result.

## Implementation slices

1. [x] Require a document to submit (but not to save a draft), on both web and API.
2. [x] Persist and edit multiple next-of-kin entries while retaining legacy nominee fields.
3. [x] Persist and edit guarantor/collateral entries with API validation and migrations; [ ] model product-specific guarantor/collateral rules.
4. [~] Verify searchable controls and section gating against the live reference. Local Escape behavior is verified; conditional live sections remain unverified.
5. [x] Measure 1920, 1440, 1280, 1024, and mobile layouts; run build, tests, typecheck, and targeted lint. [ ] Exercise create → approve → disburse and ledger/report reconciliation.

Do not mark this plan complete until every slice has evidence and there are no form fields that silently disappear on submit.
