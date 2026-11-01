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
| Saved-filter behavior | The Loans reference shows save/clear filter controls, but the supplied screenshot does not expose the save flow or Add filters menu choices. AIMSCAMS has no persistent saved-filter service. | The local page provides clear filters, live loan-officer filtering, Product and Tenure filters, and an unavailable-state message for saving. Confirm persistent storage and the exact reference filter choices before expanding behavior. |
