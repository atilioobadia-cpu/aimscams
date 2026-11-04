# Messages parity pass

Status: Messages shell and four section layouts updated; template and user optional-filter controls now have local behavior. Production behavior remains read-only.

## Live Wakandi reference

Inspected in the signed-in Chrome session, read-only, at a 1225 by 567 CSS-pixel viewport (device scale factor 1.5).

- The Message Service header shows SMS and email credit summaries and a single row of Refresh, Create Template, Create Segment, Send Message, and Recharge controls.
- The four sections are Logs, Messages, Segments, and Users. The active section uses a white background, teal text, and a 2px teal underline. The tab height measured 44px.
- Header action controls measured 28px high. Their shared border is teal, corner radius 6px, and button text uses Roboto.
- Messages uses Name and Type filters plus Add Filters. Its table columns are Name, Type, Date, Template Key, Enable / Disable, Costing, Template Version, and Actions.
- Segments uses Name and Date filters. Its columns are Name, Alias, Date, Enable / Disable, and Actions.
- Users uses Name and Phone filters plus Add Filters. Its columns are Name, Phone, Email ID, Enable / Disable SMS, Enable / Disable Email, and Actions.
- Wakandi displayed paginated live records in Messages and Users; this note intentionally omits member and recipient details.
- The Create Template form opens without saving. Its visible fields are Select Type, Name, and Template Key, with Create and Cancel actions. Type options observed were Account, User, Request, Settings, Marketing, Transaction, Notification, Other, Login, Jobs, and Invitation.

## AIMSCAMS baseline and changes

Before the patch, the local Messages page measured 1211 by 615 CSS pixels at device scale factor 1.5. Its shared header card measured 984 by 163px; the five actions wrapped across three rows. The local tabs measured 59px high. The message filter toolbar was 148px high because the Type select expanded to 959px, pushing the table to y=491. Local body text remains at the project 12.8px scale.

The current patch compacts the shared service header and tab strip, shrinks the shared header actions to 28px, constrains filter controls, and reduces the toolbar controls to 34px. The Segments page now uses the same shared header and tab implementation as the other sections. Messages Add Filters now exposes Date and Template Key; Users Add Filters exposes Email. Selected fields add local controls, and template values filter the locally loaded template items.

After the patch, the visible AIMSCAMS tab was remeasured in Chrome at 1211 by 615 CSS pixels (device scale factor 1.5):

- Shared header: x=213, y=78, w=998, h=135px.
- Tabs: y=233, h=44px; Logs 67px, Messages 98px, Segments 97px, Users 73px.
- Messages controls: Name x=225/y=314, 73 by 33px; Type x=306/y=314, 67 by 33px. The Add Filters button uses the reference 132.104 by 32.125px box.
- Header actions: Refresh 82 by 28px; Create Template 130 by 28px; Create Segment 130 by 28px; Send Message 122 by 28px; Recharge 92 by 28px. Their positions are within 2–4px of the captured Wakandi positions; vertical position is 1px lower.
- Messages table: x=213, y=363, w=1160, h=251px.
- Segments and Users share the same 44px tabs and y=363 table start. Their toolbar controls now match the compact Wakandi sizing (34px high).
- Logs controls are compact and fit on one toolbar row; the local table retains a 1100px minimum width to allow horizontal scrolling.

## Remaining gaps

- The visible local section layouts and geometry were rechecked after the patch. A direct post-edit Wakandi Logs measurement remains pending because Chrome detached its debugger during the filter inspection.
- AIMSCAMS returned an empty template table during inspection. Wakandi's populated production table makes row-level visual parity data-dependent.
- AIMSCAMS's Create Template form currently asks for Key, Name, Channel, and Body, while Wakandi's inspected form asks for Type, Name, and Template Key. The API requires a message body, so retain it until the local data contract is reconciled; do not remove required fields just to copy the reference form.
- The local optional filters use the observed field choices but do not yet reproduce Wakandi's full condition/value workflow or its table-column persistence. Users Email cannot be exercised against records until AIMSCAMS has a local message-user data source.
- Credits show as Unavailable locally; Wakandi shows numeric SMS credits and an unlimited email balance. This requires a local data source, not a CSS change.
- Logs still needs a separate live comparison of table columns, row density, and pagination. No production records or templates were changed.

## Follow-up implementation

- Added searchable optional-filter menus for Messages and Users using the fields visible in the authenticated live Wakandi session (Date, Template Key, and Email).
- Template Date and Template Key filter the local template list; removing a selected field removes its control. The menu closes on outside click or Escape.
- Users Email is a local input, while actual filtering remains unavailable because the Users register has no local records/API. No reference records were copied or changed.
- Direct measurement of the live Users Add Filters control: 132.104 × 32.125px, 11.76px Roboto. AIMSCAMS after adjustment: 132.094 × 32.125px; its label remains at the required v1.2.0 12.8px scale.
- Visible-browser checks confirmed the Date/Template Key options, their date/text controls, Email option and email control, removal, Escape dismissal, and outside-click dismissal. `npm run typecheck` passed. No message was sent and no template was created.
