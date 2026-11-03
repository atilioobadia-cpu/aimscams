# Accounting UI parity audit

Reference: authenticated Wakandi production pages under `/accounting/*`. Inspection was read-only; no entries, ledgers, or asset records were created or changed.

## Page-by-page findings

| Wakandi page | Reference UI | AIMSCAMS work |
| --- | --- | --- |
| Charts of Accounts | White title card; Add Groups/Add Ledgers actions; period selector; opening-balance warning; expandable account tree with code, type, opening/closing balances, and row actions. | Existing local chart view already follows the card/tree structure and keeps its local create/edit flows. No layout rewrite was needed in this pass. |
| Entries | Page title and date period, Download PDF/Excel/CSV controls, and a dense table with Date, Entry ID, Details, Entry Type, Status, Ledger Code, Ledger Name, Debit, and Credit. Empty state and paging are shown when there are no rows. | Kept local journal creation, posting, reversal, and search/status/type/date filters. Removed the misleading Archived control because the local API has no archived-entry feature. The local Entries toolbar still differs: it does not yet provide the three reference export actions, and the extra local filters remain visible. |
| Ledger Entries | Date period, ledger/type filters, Add Filters, and exports above a wide entries table; empty state when criteria return no rows. | Replaced the custom balance-summary dashboard and nested accounting tabs with a reference-shaped table, date/account/type controls, empty state, and paging. The local endpoint remains scoped to one ledger account and has no Add Filters/export controls. |
| Asset Types | Two tabs: Asset Type and Asset Allocation. Type list uses name/ledger/action columns; allocations use a wide register with text and type filters. | Added both tabs, their corresponding columns, local search/type filtering, and horizontal scrolling for the wide allocation table. |
| Fixed Asset | Fixed Assets header with Add Fixed Asset and Import; Show filter; register columns for name, number, type, purchase/entry dates, and purchase price; empty state. Add opens a long, scrollable Details form. | Matched register columns, search/status filter, header actions, and empty state. Import is disabled with an explanation because local bulk import is not supported. Existing create form remains limited to fields accepted by the local API. |
| Reports | Fifteen report cards in a four-column desktop grid, with an information icon on each card. | Aligned the grid to four columns at the local desktop breakpoint and compacted card height/padding while preserving existing report routes. |

## Shared navigation

Updated Accounting submenu labels to match Wakandi: `Entries`, `Asset Types`, `Fixed Asset`, and `Reports`. Kept `Chart of accounts` and `Ledger entries` labels consistent with the local title case and the reference destinations. The secondary Accounting navigation now calls journal pages `Entries`.

## Local data-model gaps

- Asset types do not store the reference Ledger, Residual Value, or Rate fields. Those columns cannot show real matching values until the local API/schema supports them.
- Fixed assets do not store the full reference Details form (including separate entry date, supplier fields, serial number, warranty, depreciation method, and valuation data). The UI does not fabricate these values; unavailable register fields remain blank or em dashes.
- Bulk import for fixed assets is not implemented locally, so the matching Import action is intentionally disabled and explains why.
- Ledger entries are currently queried by one selected local ledger account. The reference can display a broader result set; the local endpoint does not currently provide an all-ledger query in the same shape.
- The local report hub contains the same 15 report destinations, but report data and results still depend on each local report endpoint and local ledger data.

## Verification

- Compared the visible Chrome rendering of AIMSCAMS and Wakandi Accounting Reports at the same browser viewport; both show the same 4-column, 15-card arrangement and card ordering.
- Opened the local Asset Allocation tab and confirmed the reference columns and horizontal overflow container are present.
- Opened the local Fixed Assets and Ledger Entries pages and confirmed their reference-style headers, filters, columns, and empty states in the rendered UI.
- Ran `npm run typecheck -w @aimscams/web` successfully after the implementation changes.

Exact parity for data-dependent rows and fields remains limited by the local API gaps listed above.
