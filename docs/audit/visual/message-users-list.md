# Message Users visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\messages-users-list\FULL.png`  
AIMSCAMS route: `/messages-users-list`

## Changes

- Added the shared Message Service header and section tabs to the Users route.
- Added the Name/Phone search field and reference table columns: Name, Phone, Email ID, Enable / Disable SMS, and Enable / Disable Email.
- Kept the table empty because AIMSCAMS does not yet expose a message-user or notification-preference API; no user records or channel controls were fabricated.
- The Create Template action remains separate from the Users register and opens the template workspace.

## Verification and limitations

Reviewed the Users route in visible Chrome and confirmed the tab, controls, table headings and empty state. Wakandi evidence was the saved screenshot; live DevTools measurements were unavailable while SSO reCAPTCHA was failing. No message-user settings were changed.
