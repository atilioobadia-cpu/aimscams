# Loan application details visual audit

## Evidence

- References: the `FULL.png` captures under `F:\Wakandi\account-loan-application-details-39` and `F:\Wakandi\account-loan-application-details-124`.
- AIMSCAMS route: `/account-loan-application-details/[id]`, inspected in the visible browser at 1470 × 1094 CSS px (DPR 1.0).
- The local list has no application rows. Opening a reference numeric suffix locally returns the API validation message that an application UUID is required. No record was changed.
- Reference record and staff values are not reproduced in this audit.

## Structural comparison

| Reference | AIMSCAMS | Finding |
|---|---|---|
| Application summary card with status, product and actions | Plain page title and status badge | Major layout mismatch; populated local state is unavailable |
| Four named review stages | Draft, Submitted, Decision timeline | Workflow-stage model is missing locally |
| Previous/current stage status and assignment controls | Not present | Assignment and review state cannot be mapped |
| Approval history, Notes, Score history, Audit history and Documents tabs | Separate static sections for application details and next of kin | Major structure and workflow mismatch |
| Document table with uploaded file metadata and row actions | No document tab in the visible route state | Local matching document data is unavailable |

## Recommendation and blocker

The details screen needs a workflow-stage and review-history model, plus tab content backed by application documents and approval data, before a faithful populated-state implementation can be verified. Keep the current local behavior intact until those fields and actions are mapped; do not fabricate stage assignments, history, or records from screenshots.

## Status

Reference structure reviewed. Local populated-state comparison is blocked by the empty local application list and UUID-only route contract. The outstanding workflow model is tracked with the loan-application list issue.
