# General settings visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-account\FULL.png`
AIMSCAMS route: `/settings/general` (the `/settings` route redirects here)

## Reference observations

The saved Wakandi capture has a General title card with Info and Appearance tabs. Info presents institution details as read-only values in a multi-column layout, followed by Online Collections and an Edit action for the preferred savings product. A centered dialog contains the product selector, explanatory copy, Cancel, and disabled Save when unchanged. Appearance has three theme presets, a Dark Mode switch, primary-color swatches, a compact-to-comfortable scale slider, Reset to Defaults, and Save Settings.

These observations come from the saved capture. Wakandi's current live session is at SSO with a reCAPTCHA service error, so current live computed pixel measurements were not captured.

## AIMSCAMS changes in progress

- Added a standalone General title card followed by a separate Info/Appearance tab strip.
- Info now defaults to read-only fields, opens the existing server-backed organisation form with Edit, and keeps the existing save/cancel behavior.
- Added local Appearance preference controls for presets, dark mode, accent color, and UI scale. Default scale remains the v1.2.0 compact value.
- Added an Online Collections section that states the preference is unsupported by the AIMSCAMS organisation settings API; Edit remains disabled. No fake routing behavior was introduced.

## Remaining gaps / verification

- The local organisation contract has no preferred savings product/online routing field and no transaction PIN update flow.
- Exact live F12 comparison is pending because Wakandi could not pass SSO in this browser session.
- Chrome automation timed out while focusing the local tab, so post-change visual verification is pending. Typecheck and targeted lint passed.
