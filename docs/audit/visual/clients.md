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

## Live Wakandi filter recheck — 2026-11-02

- Read the authenticated `/clients` route directly in Chrome. The Type condition is `Is`; its values are Company, Group, GroupMember, and Individual. The Status condition is `Is`; its values are Active, Blocked, Dormant, Exited, Inactive, Pending, Rejected, and Requested. Clear and Apply remain disabled until a value is selected.
- No filter value was selected or applied. The production list and records were not changed.
- AIMSCAMS' current database and API only support Individual/Group and Active/Inactive/Pending. The API silently ignores unsupported type or status query values, so adding the extra choices only in the web filter would return an unfiltered list. The remaining type/status parity requires an explicit model/API change and local list verification.
- Chrome control stopped when opening a new local AIMSCAMS tab because the browser URL could not be verified safely. The live Wakandi observation is complete; comparison against the running local page and inspection of the Add Client/Add Group flows remain pending. Do not move to another page until this Client work is resolved.

## Full client reference pass — 2026-11-02

- Reviewed all 42 images in `F:\client_snaps` for client list, client and group creation, client profile tabs, and client edit states. The captures include live customer details; this audit records no names, identifiers, contact details, or financial values from those records.
- Rechecked the authenticated Wakandi Create Client form in Chrome. Its first section requires Policy, Date Of Joining, and Branch Name; Client Manager and Group Name are optional. Reference Number is generated in a six-digit format. AIMSCAMS already applies those required rules and uses a six-digit reference. The required date was present in the local component; the earlier missing asterisk in the local accessibility tree was not a product mismatch.

### Verified form differences

- **Create Client — Personal Details:** Wakandi separates First, Middle, and Last Name; derives a read-only Age from Date Of Birth; and exposes Gender, Marital Status, Nationality, Father's Name, Spouse's Name, Number Of Dependents, and a Person With Disability checkbox. AIMSCAMS currently has one Full Name field, editable Gender text, Date Of Birth, dependents, and disability text. The remaining fields and matching controls are missing.
- **Create Client — Contact Details:** Wakandi uses required Country Code and Phone Number fields, plus MNO and Email Address. AIMSCAMS has Phone Number and Email Address, but has no Country Code or MNO. AIMSCAMS currently places Address, Region, District, and Ward in Contact Details; Wakandi places residence addresses in a separate Residence section.
- **Create Client — Identity Number:** Wakandi shows National ID Number and Tax Number without a required marker in the captures. AIMSCAMS marks National ID required and blocks progression until its national-ID pattern passes. Requiredness and validation need an explicit parity decision before changing behavior.
- **Create Client — Residence:** Wakandi captures Current Residence Address, a Last Residence Is Same As Of Current checkbox, and Last Residence Address. AIMSCAMS has one free-text Residence field.
- **Create Client — Employment:** Wakandi captures Current Place Of Employment and Last Place Of Employment with a same-as-current checkbox. AIMSCAMS captures Occupation and Income instead.
- **Create Group — Membership Details:** Required Policy and Branch Name plus optional Relationship Manager match the visible reference structure.
- **Create Group — Group Details:** Wakandi requires Region/State, District/City, Group Name, Country Code, and Phone Number; it also exposes Ward, Office Number, and an optional Group Meeting Date section with a required Frequency and Add action. AIMSCAMS currently asks for Group Name and optional reference/date/meeting day/time/place only. The location, phone, office, and meeting-frequency controls are missing, and Group Name/Phone requiredness differs.
- **Edit Client:** The reference has Membership Details, Personal Details, Contact Details, Identity Number, Next of Kins, and Upload Documents sections, with photo/signature upload controls. AIMSCAMS has no matching client edit form or document-upload workflow in the inspected route implementation.

### Client profile parity

- Wakandi's individual profile captures show Summary, Users, Accounts, Charges, Residence, KYC, Income, Assets, Bank, Verification History, Statement, and History tabs.
- AIMSCAMS currently uses Details, KYC, Income, Residence, Assets, Bank, Members, Users, Charges, History, Statement, Transaction, and MNO. Details renders raw profile JSON; the other tabs render placeholder empty states. The visible tab names/order and the actual data/actions remain a major gap.
- Production-only actions and data remain read-only. No client or group records were created, edited, or deleted. No sample data was added in AIMSCAMS during this pass.

### Completion gate

Clients is **not complete**. Close the personal/contact/identity/residence/employment fields, group details, edit/upload flow, profile tab labels/order/behavior, and local interaction states; then verify both desktop widths and the collapsed sidebar in the visible browser. Do not proceed to the next page until that verification passes.

## Visible form comparison and implementation update — 2026-11-02

- Restored the user-visible Chrome session, opened the blank Wakandi Create Client and Create Group forms, and compared the first membership sections. No production form values were entered; no records were created, edited, or deleted.
- Compared the local Create Client membership step in Chrome. Its required Policy, Date Of Joining, and Branch Name, optional Client Manager and Group Name, generated six-digit reference, and original font/control scale remain intact. Removed the extra outer form frame and changed the title action to the reference close icon.
- Added the captured Personal Details, Contact Details, Identity Number, Residence, and Employment fields to the local Create Client form. Age is calculated and read-only; disability and same-as-current controls are checkboxes; Identity Number fields are optional as shown in the captures. The create payload keeps the profile fields grouped under personal, contact, identity, residence, and employment.
- Compared the local Create Group membership step in Chrome; it matches the reference Policy, Branch Name, and optional Relationship Manager structure. Replaced the previous unrelated reference/date/day/time/place inputs with the captured Region/State, District/City, Ward, Group Name, Country Code, Phone Number, Office Number, and optional Group Meeting Date/Frequency/Add controls. The payload uses the `contact` and `meeting.frequency` fields read by the existing group detail view.
- The complete selectable values for Country Code, MNO, Nationality, and Group Meeting Frequency are not verified from the currently accessible blank production forms. Do not claim these option lists are exact; keep them open until the reference values can be observed without entering production data.
- Focused ESLint and web TypeScript checks passed after the payload-shape adjustment. No client or group sample record has been added.

### Still open before Clients can be committed as complete

- Unlock and visually inspect the local Group Details step without submitting a record, then compare field dimensions and spacing at the standard and collapsed-sidebar layouts.
- Verify country/MNO/nationality/frequency option values from the supplied reference captures or safe read-only controls.
- Implement and verify the missing client edit/upload flow and align individual profile tabs and their content/actions with the reference.
- Resolve the list type/status values and backend support, invitation-link service gap, and any remaining row/table differences recorded above.

Clients remains the active page. Commit and proceed only after those client-specific checks pass.

## Sample-data setup — 2026-11-02

- The authenticated Wakandi Clients page and blank Add Client form were read in Chrome. Only the policy configuration and form structure were inspected; no production values were entered and no Wakandi records were created, edited, or deleted.
- Added a matching active Individual membership policy in local AIMSCAMS and created four fictional QA members, bringing the local list to five total entries including its pre-existing row. Their personal details are synthetic and are not copied from Wakandi.
- Opened one local sample profile and selected Residence. The browser still showed the empty state after reload. Added profile rendering for the residence fields when the API returns them; the stored profile response for this existing sample still needs verification before this result can be marked resolved.
- The new conditional Residence view uses the existing font and spacing tokens. Focused ESLint and `tsc --noEmit --incremental false` passed. The regular workspace typecheck could not generate `.next/types/routes.d.ts` because the running dev server held the file open.
- Other previously recorded Clients gaps remain open: Edit Client and document uploads, profile tabs backed by local records, unsupported production type/status values, invitation-link service, and table details. Keep Clients as the active page until these are resolved and browser-verified.

## Live Individual membership policy check — 2026-11-02

- Opened Wakandi's authenticated Settings > Policies > Membership Policy page in Chrome and viewed the Individual policy details. The production system remained read-only.
- Wakandi lists the Individual policy as Approved. Savings, shares, fees, and self-onboarding are disabled; member activation is enabled.
- The details require manual member verification, set dormancy at 365 days, allow withdrawals, activate members automatically upon deposit, and require one to two next of kin. No auto-debit rules are configured for this scope.
- Queried only local policy configuration inside a `BEGIN READ ONLY` transaction, after confirming the database host and `APP_ENV` are local. AIMSCAMS already has an active `INDIVIDUAL` policy with matching member type, next-of-kin limits, dormancy, withdrawal, deposit activation, verification-required, and manual verification settings. No duplicate policy was created.
- The local policy model does not represent savings, shares, fees, self-onboarding, approval status/history, or version history; those remain Settings/Policies parity gaps. The Create Client flow already requests active membership policies, so this record is available to local client creation.
