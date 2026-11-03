# Entries parity record

Date: 2026-11-03

Reference: authenticated Wakandi `/accounting/entries`, inspected live in visible Chrome.

Local route: `/accounting-entries`.

## Reference measurements

Wakandi was measured at a 1280 × 590 CSS-pixel viewport, DPR 1.5, with page scroll at the top.

| Element | Wakandi measurement and style |
| --- | --- |
| Title card | x 220.16, y 84.82, w 1024.35, h 90.39; white, 0.667px solid `#dee2e6`, 8px radius, 20.16px padding |
| Title | x 267.86, y 105.65, 20.16px Roboto, weight 600, `#495057` |
| Export buttons | PDF 120.10×28.77, Excel 126.50×28.77, CSV 121.04×28.77; 11.76px Roboto 500, teal `#057573` outline, 0.667px border, 6px radius, 6.72px × 8.4px padding |
| Period selector | x 936.97, y 105.66, 280×28.75; teal outline, 6px radius, 11.76px Roboto label |
| Filter toolbar | x 220.16, y 202.08, w 1024.35, h 56.41; `#f8fafc`, 0.667px `#e2e8f0` border, 6px radius, 10.08px padding |
| Search | 191×34.13; white, 0.667px teal border, 6px radius, 13.44px Roboto, 8.4px 10.08px 8.4px 33.6px padding |
| Filter controls | Date Range 102.06×34.93, Entry Type 96.82×34.93, Status 75.53×34.93, Archived 87.85×34.93; 11.76px Roboto 500, teal outline, 6px radius |
| Table | x 220.16, y 258.49, w 1024.35; header 52.81px high, `#f8fafc`, 13.44px Roboto 700, body 13.44px Roboto |
| First grouped row | 178.02px for the observed four-line posting. Columns: Date, Entry ID, Details, Entry Type, Status, Ledger Code, Ledger Name, Debit (TSh), Credit (TSh) |

Filter popovers were opened read-only. Date Range exposes On, Before, After, and Between; Entry Type, Status, and Archived each expose an Is condition. No filter was applied. The first entry's details panel was opened and closed without changing the production record. No exports were downloaded.

## AIMSCAMS changes

- Added the nine-column register and multi-line ledger rows to the local Entries list. The journal API list now returns ledger code, name, and debit/credit values for each row in a batched query.
- Matched the measured title card, export controls, period selector, toolbar, search input, table header, compact spacing, colors, borders, and page controls.
- Kept local manual-entry creation available as a compact plus action at the end of the filter toolbar; this local workflow is not shown in the Wakandi reference view.
- Added working date, entry type, status, search, page navigation, and page-size controls using the local API's supported filters.
- CSV and Excel actions export the currently loaded page. The PDF action opens the browser print dialog so the user can save a PDF.
- The local test dataset has one opening-balance journal entry with five ledger lines; it does not match Wakandi's production records. No local or production journal records were created or edited during this pass.

## Remaining differences

- Local API has only `draft` and `posted` states and has no archived-entry flag. The Archived control remains visible and explains this limitation; it does not fabricate archive behavior.
- Local row content depends on local journal data. Current local records do not reproduce Wakandi's production transactions or its 173-row history.
- The local browser viewport was 1225 × 567 CSS pixels while Wakandi was 1280 × 590. Local content therefore measured 998.69px wide; its 1024px table stays horizontally scrollable. Vertical toolbar and table positions aligned to the Wakandi coordinates within 0.5px after adjustment.
- PDF uses the browser's print flow rather than a server-generated PDF file.

## Verification

- Confirmed the local page renders and displays all five ledger lines for the existing opening-balance entry.
- Opened the local Date Range and Entry Type popovers to confirm the controls render; did not apply a filter or download a file.
- Captured and compared live computed styles and bounding boxes in DevTools/Playwright at the viewport sizes recorded above.
- TypeScript typecheck and API workspace checks are recorded after the page changes are complete.
