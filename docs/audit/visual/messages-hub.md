# Messages workspace visual audit

Date: 2026-11-03
Reference: `F:\Wakandi\messages-template-list\FULL.png`, plus Logs, Segments and Users captures.
AIMSCAMS routes: `/messages`, `/messages-message-logs`, `/messages-segment-list`, `/messages-users-list`

## Reference structure

The Message Service pages share a title/credit/action header and a four-tab strip: Logs, Messages, Segments and Users. Each tab keeps its controls and table headers visible when the local list is empty.

## AIMSCAMS changes

- Replaced the `/messages` placeholder with the local template register under the Messages tab.
- Added a shared header/tab shell to `/messages`, Delivery Logs and Users; Segments already used the same captured pattern.
- Added persistent, horizontally scrollable tables with the reference column order for templates, delivery logs and message users.
- Moved template creation into a dialog opened from Create Template. No template was submitted.
- Kept rows sourced from AIMSCAMS APIs. Where its model does not contain reference values such as credits, template version, company, or message-user preference records, the page does not fabricate them.

## Measurement and verification

The comparison used the available saved Wakandi captures and a visible Chrome review of the local Messages, Users, template dialog and Logs views. Exact Wakandi DevTools measurements were not captured in this pass because SSO could not connect to its reCAPTCHA service. No Wakandi data was modified; no message was sent.

Validation: `npm run typecheck -w @aimscams/web` and targeted web-workspace ESLint both passed.
