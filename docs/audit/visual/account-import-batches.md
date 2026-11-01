# Account Import Batches visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\import-account\FULL.png`  
AIMSCAMS route: `/import-account`

## Comparison

The reference uses an action card with upload/template actions, a search/status/add-filter toolbar, and a batch result table. AIMSCAMS shows a plain heading, zero batch count, New Import button, and an empty-state card; no local batch rows are available.

## Recommendations

- Align the title/action card, filter strip, and empty table structure.
- Render batch metadata only from the account import response.
- Keep the upload workflow separate from the batch history list.

Browser review was read-only. No file was selected or uploaded.  
Implementation commit: none; page structure/data gap.
