# Clients page visual audit

## Evidence

- Wakandi reference: `https://cams.wakandi.co.tz/clients`, inspected in the authenticated Chrome session at 90% zoom. Temporary filters were cleared; the reference was left on its default list.
- AIMSCAMS: `http://localhost:3000/clients`, inspected in the visible Chrome session at the current local viewport.
- Production rows were viewed only to understand layout and filter behavior. No row values or customer identifiers are recorded here, and no records were changed.

## Observed reference behavior

- The page title sits in a bordered header card with Add Client, Add Group, and Client Invitation Link actions.
- Search, Type, Status, and Add Filters controls appear in one toolbar above a horizontally scrollable table.
- Type and Status open condition/value popovers with Clear and Apply actions. Their condition is `Is`.
- Add Filters opens a searchable, scrollable checklist of nine fields: Member Id, Full Name, Reference Number, National Id, Phone Number, Email Address, KYC Status, DOJ, and Group Name.
- A selected additional field appears as a removable filter chip. Opening the chip shows a condition and value control. Text conditions observed in Wakandi are Contains, Equals, Starts with, Ends with, and Does not contain.
- The table keeps the identifier, name, reference, identity, type, contact, status, KYC, joining date, group, and row actions in a horizontally scrollable region.

## AIMSCAMS changes and verification

- Type and Status now use condition/value popovers with Clear and Apply actions. AIMSCAMS currently offers Individual and Group, and Active, Inactive, and Pending, because those are the values supported by its local client model.
- Add Filters now provides the nine reference fields, a field search input, removable chips, text matching conditions, and an exact date filter for DOJ.
- The existing font scale, shared shell, title actions, table density, and local sample records were retained.
- Manual browser verification covered opening the Type popover, opening the searchable filter checklist, adding Full Name, applying a harmless synthetic value to confirm the empty state, clearing the value and field, and restoring the unfiltered list.
- Focused ESLint completed successfully for `apps/web/src/app/(app)/clients/page.tsx`.

## Remaining differences and blockers

1. AIMSCAMS' client model only represents two client types and three statuses. Wakandi exposes additional production values; those cannot be reproduced faithfully without extending the product model and backend behavior.
2. The local environment has one client sample, so row density, production pagination, and group-row details cannot be compared against the larger reference dataset. No records were copied or added.
3. Client Invitation Link is visible locally, but the local dialog reports that no activation-link service is configured. Do not invent a token flow without a backend route.
4. AIMSCAMS has additional columns beyond the initial Wakandi viewport; horizontal scrolling is available. Keep exact column parity open for a dedicated table pass.
5. Hover and focus colors have not been measured systematically.

## Status

The Clients list now follows Wakandi's filter interaction pattern for the values AIMSCAMS supports. Filter behavior was verified in the browser without changing client data. The page is not a complete production parity match while the model, activation-link service, row dataset, and remaining table details differ.

## Local list re-review — 2026-11-01

- Read the visible AIMSCAMS `/clients` page directly. The list exposes Add client, Add group, Client activation link, Search, Type, Status, Add filters, the client table, and pagination.
- Opened Type, Status, and Add filters. Type exposes `Is` with Individual/Group values; Status exposes `Is` with Active/Inactive/Pending values; Add filters exposes Member ID, Full Name, Reference Number, National ID, Phone number, Email address, KYC Status, DOJ, and Group Name.
- Applied Group against the single existing local client and saw the no-match state. Cleared the filter and confirmed the existing row returned. This changed only the local filter state; no client data was edited or created.
- The active Wakandi session is now on Clients. Its live accessibility tree confirms the column labels Member Id, Full Name, Reference Number, National Id, Type, Phone Number, Email Address, Status, KYC Status, DOJ, and Group Name. AIMSCAMS now uses those visible labels and the same Add Filters capitalization; the action column retains only an accessible Actions name. No screenshots were used for this re-review.
