# Requests visual audit

Date: 2026-11-03
Reference: F:\Wakandi\requests\FULL.png and three tab-state captures
AIMSCAMS route: /requests

## Reference structure and behavior

- The page header is a white bordered card with a teal envelope icon, Requests title, and five counters: total, pending, approved, rejected, and cancelled.
- The queue is a single white card. Its three tabs are Assigned Requests, Active Requests, and All Requests; the reference captures show each tab state, with All Requests active in the full-page capture.
- A single toolbar contains Search, Request Status with a clear control, Add Filters, and a funnel/apply control.
- The register headings are Request by User, Request Type, Amount, Current Assignee, Approved by, Request Status, Approval Date, Created Date, and a column-settings control.
- An empty queue retains the toolbar and table headings and shows an inbox icon with No data available.
- The local request API already exposes the summary counts and supports status, request type, assignee, and free-text filtering. No schema or API changes were required.

## AIMSCAMS changes

- Replaced the eight status chips and separate search card with the reference's three-tab queue, summary header, compact filter toolbar, and persistent table/empty state.
- Connected the tabs and filters to the existing request-list endpoint. No approve/reject operation is invoked from this page.
- Reordered the table fields to match the reference and retained local pagination when records exist.
- Kept the shared AIMSCAMS header, sidebar, Roboto scale, and product branding.

## Measurement and verification

- Compared the supplied reference captures at their saved resolution and inspected the updated AIMSCAMS page in the visible Chrome tab.
- Reference screenshot geometry at 1838 × 919 rendered pixels: header card about 94px high; tab strip about 55px; toolbar about 72px; table header about 47px; empty row about 212px. These are screenshot-derived target values, not Wakandi DevTools computed CSS.
- Wakandi was not authenticated during this pass; SSO returned a reCAPTCHA connectivity error. No production data was changed.