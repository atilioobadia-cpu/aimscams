# Transaction Import Wizard visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\import-transaction-new\FULL.png`  
AIMSCAMS route: `/import-transaction-new`

## Comparison

The reference has a four-step flow: Upload File, Field Mapping, Validation and Preview, and Result. It accepts CSV or Excel and uses a large centered upload panel with a disabled Next action until a file is selected. AIMSCAMS has three steps (Upload, Preview, Commit), CSV-only input, and a batch-reference field with schema text.

## Recommendations

- Align the wizard steps and centered upload layout after the missing mapping and validation stages are available.
- Support the reference file formats through the import parser.
- Keep transaction posting unavailable until validated preview and commit safeguards are implemented.

Browser review was read-only. The file chooser was not opened; no upload or commit occurred.  
Implementation commit: none; workflow/state mismatch.
