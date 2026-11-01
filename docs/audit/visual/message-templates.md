# Message Templates visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\messages-template-list\FULL.png`  
AIMSCAMS route: `/messages-template-list` (confirmed in the visible browser; heading “Templates”).

## Comparison

The reference shows the shared Message Service header/actions and Messages tab with Name/Type filters, enable controls, costing, template version, and a paged list. AIMSCAMS instead places an Add template form above a search field and a template list. The local API had no template rows in the captured state. The reference-map “create” identifier resolves to this same page; template creation is supported by the page and `createMessageTemplate` API call.

## Recommendations

- Add the shared service header and template list structure from the reference.
- Keep template creation as a separate action/form and preserve the current empty-data state.
- Add enable, costing, and version fields only when they are supported by the local template model.

Browser review was read-only. No template was added or changed.  
Route reconciliation: complete. Local data/model and shared-shell differences remain in the visual queue.
