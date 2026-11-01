# Member Import Wizard visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\import-member-new\FULL.png`  
AIMSCAMS route: `/import-member-new`

## Comparison

The Wakandi capture shows the Members heading and subtitle in a large white card, a horizontal four-step progress row (Upload File, Field Mapping, Validation And Preview, Result), a centered upload prompt, and a Next button at the lower right. The local page now follows that initial layout and exposes the same four steps. The upload and result stages retain AIMSCAMS member creation through the existing client API.

The visible in-app browser confirmed the updated page renders at `/import-member-new` after sign-in. Its viewport is much narrower than the reference, so the full-width geometry is not scored. The file picker did not open through the in-app browser automation, so a synthetic CSV was not previewed this pass.

## Workflow and data limits

- Local parsing supports CSV up to 10MB. Excel parsing is unavailable because the project has no spreadsheet parser dependency; the interface states CSV support clearly.
- Field mapping covers reference number, full name, client type, phone, and national ID. Reference number is optional because the local API can generate it.
- The local client model has no user-relationship fields from the Wakandi description.
- Validation and preview occur before the final import step. No member records were created during this review.

## Verification

- `npm run build -w @aimscams/web` passed.
- Reviewed the initial wizard state in the visible in-app browser.
- File upload and mapped preview remain unverified because the browser file chooser timed out.

Implementation commit: `72182e0` (`feat(import): align member wizard with reference`).
