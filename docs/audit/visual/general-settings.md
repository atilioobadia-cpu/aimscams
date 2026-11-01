# General settings visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-account\FULL.png`
AIMSCAMS route: `/settings/general` (the `/settings` route redirects here)

## Comparison

The reference uses a General title card with Info and Appearance tabs. Its Info state shows institution identity details and online collection routing; the captured overlay edits the preferred savings product for online payments. AIMSCAMS shows editable legal name, registration number, board dialect, timezone, and default branch in an Institution identity card, plus Installation metadata and a tenant-scope explanation. There is no Info/Appearance tab set, online collections section, preferred savings product editor, or matching modal state. The local page has a strong two-column card layout and the same general settings purpose, but a different contract and composition.

## Recommendations

- Add the Info/Appearance tab structure and the online collections preference where supported by the organisation settings model.
- Preserve installation identity/timezone/default-branch controls as AIMSCAMS-specific requirements, placed within a clear settings hierarchy.
- Compare editable modal geometry only with matching local dialog state; this review did not open or save the preference editor.

Read-only browser review; no institution settings were changed or saved. Implementation commit: none.
