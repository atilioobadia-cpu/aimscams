# Needs human decisions

These items need product-owner direction or missing reference material. No guesses have been applied to the AIMSCAMS UI.

| Item | Why a decision is needed | Current audit treatment |
|---|---|---|
| Active navigation pill color | User specified that it remains dark green instead of matching Wakandi teal, but the exact dark-green hex was not supplied. | Preserve current implementation during the audit; record the exact required value before any UI adjustment. |
| Hover, focus, and disabled states | The supplied screenshots do not show these states consistently. | Do not infer reference values; capture/record missing states for later review. |
| Authentication parity | Wakandi offers phone and email sign-in/recovery modes; AIMSCAMS currently exposes email sign-in and email reset. Required behavior is not yet confirmed. | Record as visual/flow differences; defer implementation choice. |
| Dashboard reference | No Wakandi dashboard screenshot exists in `F:\Wakandi`. | Keep dashboard unscored until a reference capture is provided. |
| Loan and client-group record states | Current local data has no loan rows and no group row to navigate into. | Compare page shells and visible controls only; do not seed or alter records. |
| Screenshot corpus totals | `INDEX.md` reports 438 original screenshots, but the current `MANIFEST.csv` has 576 rows and a scan finds 576 PNGs plus one JPG. | Do not use a corpus-wide pass percentage until inventory is reconciled. |
| Missing reference pages | Reference mapping includes Schedule, client-group detail, and message-template creation screenshots, but the expected local states/routes require verification and some paths are dynamic. | Keep these pages marked missing or data-blocked until a valid route and matching state are established. |
| Client activation-link behavior | The Clients reference shows an activation-link action, but AIMSCAMS has no local activation-link API or route. A secure token and expiry flow cannot be inferred from the screenshot alone. | The visible action opens a clear unavailable-state dialog. Product and API behavior remain blocked. |
| Client contact verification source | The local Client model had no phone/email verification fields. The UI migration adds `phoneVerified` and `emailVerified`, both defaulting to false; existing records therefore display unverified until a trusted local verification workflow sets them. | Keep the false default and do not infer verification from masked contact details. |
| Client sort query contract | The new server-side list sort uses `sort=<field>,<ASC|DESC>` for `memberNo`, `fullName`, `referenceNo`, and `clientType`. This is a UI/API contract introduced for Wakandi-style header sorting. | Keep other columns non-sortable until the API exposes a defined sort field for them. |
| Saved-filter behavior | Loans and loan applications show save/clear filter controls, but the captures do not expose save flow or all Add filters choices. AIMSCAMS has no persistent saved-filter service. | Clear filters and real local filters work; saving explains the missing persistence service. Confirm intended storage and exact reference filter choices before adding persistence. |
| Loan application workflow stage | The reference table displays a named review stage and assignment, but the AIMSCAMS loan-application response has no corresponding stage model or field. | Keep the column visible with an em dash; confirm whether a workflow-stage feature is required before creating workflow data or API behavior. |
