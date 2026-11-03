# Account Import Wizard visual audit

Date: 2026-11-04
Reference: `F:\Wakandi\import-account-new\FULL.png`
AIMSCAMS route: `/import-account-new`

## AIMSCAMS changes

- Replaced the former three-step Upload/Preview/Commit indicator with the reference four-step Upload File, Field Mapping, Validation And Preview, and Result progress row.
- Added an auto-detected local field mapping review before row validation.
- Kept commit isolated at the final Result step. This still creates savings accounts through the local API; no file was uploaded and no records were created during this audit.
- CSV parsing remains supported; Excel parsing and editable source-column mapping are unavailable in the current local implementation.

## Verification

Compared the saved Wakandi capture with the AIMSCAMS route in visible Chrome. Live Wakandi DevTools measurements remain unavailable while SSO reCAPTCHA blocks the session. No account or balance data was added.
