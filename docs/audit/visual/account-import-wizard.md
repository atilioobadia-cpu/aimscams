# Account Import Wizard visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\import-account-new\FULL.png`  
AIMSCAMS route: `/import-account-new`

## Comparison

The reference uses a four-step upload, field-mapping, validation/preview, and result flow, with CSV or Excel file selection in a large centered panel. AIMSCAMS uses a three-step Upload/Preview/Commit flow, accepts CSV only, and exposes a generated batch reference and CSV schema text.

## Recommendations

- Match the four visible stages and upload panel after field mapping and validation are implemented.
- Support CSV/Excel only when parsing and validation handle both formats.
- Keep commit gated behind a validated preview.

Browser review was read-only. The file chooser was not opened; no upload or commit occurred.  
Implementation commit: none; workflow/state mismatch.
