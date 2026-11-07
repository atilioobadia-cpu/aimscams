# Loan application workflow completion plan

State: `IN_PROGRESS`

Goal: finish the AIMSCAMS Create Loan Application workflow without claiming UI fields are persisted when the API/model does not support them.

## Current evidence

- Route: `/account-loan-application-create` renders `LoanApplicationWizard` in `apps/web/src/components/accounts/loan-application-wizard.tsx`.
- The current persisted model supports one nominee, booleans for guarantor/collateral, a payment destination, and loan-application document rows.
- It does not persist multiple next-of-kin entries, guarantor rows, collateral records, product-based collateral rules, or document requirement checklists.
- `LoanApplicationInput` only represents one nominee and document attachments; API create/update validation is in `SettingsService`.

## Implementation slices

1. Require at least one document when submitting (but not when saving a draft), on both web and API. Verify regression and browser behavior.
2. Replace single next-of-kin UI with add/remove entries only after extending persistence and API payload compatibly.
3. Add guarantor and collateral domain records, validation, transactional persistence and migrations; then wire the UI and product minimum rules.
4. Complete searchable controls, section gating, payment destination conditional fields, and accessible error states against live read-only reference.
5. Verify at 1920, 1440, 1280, 1024 and mobile, run relevant tests, typecheck, lint and build. Report unsupported/unverified posting behaviors explicitly.

Do not mark this plan complete until every slice has evidence and there are no form fields that silently disappear on submit.
