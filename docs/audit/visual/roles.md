# Roles visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-role\FULL.png`  
AIMSCAMS route: `/settings-role`

## Comparison and implementation

The reference shows a Role Management title card, New Role action, search and filter toolbar, paginated role table, and a tabbed Create New Role dialog. AIMSCAMS now uses that list-first structure in place of its former vertical selector and long permission matrix. The list exposes Role Name and Display Name, row actions, a column chooser, search, Role Name/Display Name filters, and 10/25/50 page sizes. Existing roles show their display name consistently in both name columns instead of enum labels.

New Role opens Details, Permissions, and Audit History tabs. The local create path requires a display name, starts with no permissions selected, validates permissions against the existing catalog, creates an organization-scoped role transactionally, and records an audit event. Existing roles can be edited and permissions managed. The permissions tab now follows the reference's flat two-column list with Select All; all permissions remain unchecked by default to avoid granting broad access unintentionally. Save stays disabled until the required role names are entered.

## Browser evidence

- At 1838×1114, the shell measured 76px for the header and 240px for the expanded sidebar. The first-page role rows measured about 67px high; the footer reported 11–17 of 17 entries on page two.
- Search, both filter fields, pagination, row actions, and the create/edit tabs were inspected in the visible in-app browser. The create permission tab loaded 200 catalog permissions across 20 groups, all unchecked by default.
- Rechecked page two (roles 11–17) and opened Create new role → Details, Permissions, and Audit history in the visible browser. Adjusted the dialog to the reference's 536px height, flattened the permission list, added Select All, and confirmed the empty history message and disabled Save state.
- At 1280×800, the browser document and body widths were both 1280px, with no horizontal overflow. The table remained inside the content area.
- The reference Audit History tab is present locally, but its content is an empty state and is not yet connected to historical role events. A live history result remains unverified.

## Remaining work

- Connect the Audit History tab to the actual audit-event history for existing roles and match populated states. The new-role empty state matches the reference.
- Run the final page regression after related shared UI changes.

The prior API and web production builds passed; this follow-up requires a fresh web build. Browser review did not create or alter role data or permission assignments.
