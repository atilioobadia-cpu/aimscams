# Member Import Wizard visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\import-member-new\FULL.png`  
AIMSCAMS route: `/import-member-new`

## Comparison

The reference uses a four-step process (Upload File, Field Mapping, Validation and Preview, Result) inside a large card, accepts CSV or Excel, and places file selection centrally with a Next action. AIMSCAMS uses three steps (Upload, Preview, Commit), requires CSV, and shows a batch-reference field plus schema text above a basic file control.

## Recommendations

- Align the wizard step labels/order and upload panel to the reference.
- Support the reference file formats and mapping/validation steps only when the import implementation can safely process them.
- Preserve validation and preview before any commit.

Browser review was read-only. The file chooser was not opened; no upload or commit occurred.  
Implementation commit: none; workflow/state mismatch.
