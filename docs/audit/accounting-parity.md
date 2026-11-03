# Accounting UI parity audit

Reference: authenticated Wakandi production pages under `/accounting/*`. Inspection was read-only; no entries, ledgers, or asset records were created or changed.

## Page-by-page findings

| Wakandi page       | Reference UI                                                                                                                                                                                                                               | AIMSCAMS work                                                                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Charts of Accounts | White title card; Add Groups and Add Ledgers actions; opening-balance warning; expandable account tree with code, type, opening/closing balances, and row actions.                                                                         | Local title card, warning, and tree geometry now align closely with the live reference. Add Groups/Add Ledgers and row edit actions remain toast-only; documented as functional gaps in `docs/parity/chart-of-accounts.md`.                                                                                     |
| Entries            | Page title and date period, Download PDF/Excel/CSV controls, compact search/filter toolbar, and a dense grouped register with Date, Entry ID, Details, Entry Type, Status, Ledger Code, Ledger Name, Debit, and Credit.                    | The local title/actions, toolbar, filter popovers, grouped ledger rows, paging, and export controls now follow the reference structure. Local archive status and full production history remain unsupported; measurements and limitations are documented in `docs/parity/entries.md`.                           |
| Ledger Entries     | Compact title/period header with PDF, Excel, and CSV actions; Date Range, Ledger Account, and Entry Type popovers; one results panel with an empty state when no rows match.                                                               | Matched header, export action placement, three compact filters, popover sizes, and results/empty-state panel. Local query is still scoped to one account; see `docs/parity/ledger-entries.md`.                                                                                                                  |
| Asset Types        | Two tabs: Asset Type and Asset Allocation. Type list uses name/ledger/action columns; allocations use a wide register with text and type filters. Asset types are configured with a ledger, residual value, rate, and depreciation ledger. | Matched the compact two-tab layout, filter popovers, allocation filters and scrolling, empty state, and Details drawer. Added local persistence for ledger links, residual value, and rate. Some allocation columns remain data-blocked by the local Fixed Asset model; see `docs/audit/visual/asset-types.md`. |
| Fixed Asset        | Fixed Assets header with Add Fixed Asset and Import; Show filter; register columns for name, number, type, purchase/entry dates, and purchase price; empty state. Add opens a long, scrollable Details form.                               | Matched register columns, search/status filter, header actions, and empty state. Import is disabled with an explanation because local bulk import is not supported. Existing create form remains limited to fields accepted by the local API.                                                                   |
| Reports            | Fifteen report cards in a four-column desktop grid, with an information icon on each card.                                                                                                                                                 | Aligned the grid to four columns at the local desktop breakpoint and compacted card height/padding while preserving existing report routes.                                                                                                                                                                     |

## Shared navigation

Updated Accounting submenu labels to match Wakandi: `Entries`, `Asset Types`, `Fixed Asset`, and `Reports`. Kept `Chart of accounts` and `Ledger entries` labels consistent with the local title case and the reference destinations. The secondary Accounting navigation now calls journal pages `Entries`.

## Local data-model gaps

- The local AssetType model now stores Ledger, Depreciation Ledger, Residual Value, and Rate. Asset Allocation still lacks Serial Number, Supplier Name/Address/Company, and User fields in the local Fixed Asset model; those cells and their filters remain data-blocked.
- Fixed assets do not store the full reference Details form (including separate entry date, supplier fields, serial number, warranty, depreciation method, and valuation data). The UI does not fabricate these values; unavailable register fields remain blank or em dashes.
- Bulk import for fixed assets is not implemented locally, so the matching Import action is intentionally disabled and explains why.
- Ledger entries are currently queried by one selected local ledger account. The local account selector works, but the endpoint does not yet provide the same broader cross-account result set as Wakandi.
- The local report hub contains the same 15 report destinations, but report data and results still depend on each local report endpoint and local ledger data.

## Verification

- Compared the visible Chrome rendering of AIMSCAMS and Wakandi Accounting Reports at the same browser viewport; both show the same 4-column, 15-card arrangement and card ordering.
- Compared both Chart of Accounts pages in the visible Chrome session; the local account tree columns and opening-balance warning match the reference structure, with the missing/placeholder actions listed above.
- Opened the local Asset Allocation tab and confirmed the reference columns and horizontal overflow container are present.
- Opened the local Fixed Assets and Ledger Entries pages and confirmed their reference-style headers, filters, columns, and empty states in the rendered UI.
- Ran `npm run typecheck -w @aimscams/web` successfully after the implementation changes.

Exact parity for data-dependent rows and fields remains limited by the local API gaps listed above.
