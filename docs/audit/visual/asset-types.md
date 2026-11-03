# Asset Types visual parity

Reference: authenticated Wakandi `Accounting → Asset Types`. Inspection and interaction with Wakandi remained read-only; the Add Asset Type drawer was opened and cancelled without saving.

## Reference measurements

Measurements are from the visible Chrome session at a 1225 × 567 CSS-pixel viewport. The app header is 65px tall.

| Element             |                                     Wakandi measurement | AIMSCAMS implementation                                       |
| ------------------- | ------------------------------------------------------: | ------------------------------------------------------------- |
| Assets title card   |                       x213, y79, 999 × 70px; 6px radius | 70px title card with the v1.2.0 type scale                    |
| Add Asset Type      |                                  x1072, y99, 119 × 29px | Compact outlined teal action; same 29px height                |
| Section tabs        |           y163, 45px high; Type 100px, Allocation 131px | Same tab widths, height, active underline, and order          |
| Type panel          |                                 x214, y208, 997 × 293px | 15px horizontal inset; compact toolbar and matching empty row |
| Type filter toolbar |                                  x230, y220, 966 × 56px | Same inset and height; Name popover is 350 × 291px            |
| Type table          | x230, y276, 966px wide; 37px header and 171px empty row | Matching compact table and centered empty state               |
| Allocation table    |             1245px scroll width inside a 966px viewport | 1245px minimum width with horizontal scrolling                |

## Inspected behavior

- Asset Type and Asset Allocation are separate tabs. Asset Type filters by Name and shows Name, Ledger, and the compact actions column.
- Asset Allocation provides a text search, Name and Asset Type filters, an Add Filters menu, and a wide table for External Asset ID, Name, Asset Type, Asset Status, Serial Number, Supplier Name, Supplier Address, Supplier Company, Entry Date, Department, User, and actions.
- Add Asset Type opens a centered Details drawer. At this viewport it is 672 × 511px, with Maximize and Close controls, followed by Asset name, Residual Value, Rate (%), Ledger, and Depreciation Ledger. The default depreciation ledger is `[5401] Current year depreciation`. Cancel closes it; Save is unavailable until required values are present.

## AIMSCAMS changes

- Matched the compact Assets header, tab positions, Name filter popover, panel/table geometry, empty state, allocation filter bar, and horizontally scrolling allocation table.
- Replaced the mismatched Code/Name/depreciation-method form with the reference Details fields and drawer. Ledger choices come from the local postable chart of accounts; no production/reference values are used to populate local records.
- Added nullable storage for ledger IDs, residual value in minor units, and rate to the local AssetType model. Existing asset types remain valid. New asset types receive an internal generated code because the reference form does not expose a Code field.
- The Add Filters menu exposes the reference options. Local records currently lack Serial Number, Supplier Name/Address/Company, and User attributes; those selected filters cannot return matches for those attributes until the local Fixed Asset model/API adds them. The corresponding allocation table cells remain blank for those fields.

## Verification

- Compared the current Wakandi and AIMSCAMS Asset Type/Allocation tabs in visible Chrome.
- Confirmed the local Name filter opens with Contains/Is/Starts with, Value, Clear, and Apply controls. The default Name filter is not applied until Apply is clicked.
- Opened and closed the local Details drawer with Cancel; no local asset type was created during verification.
- Applied the additive Prisma migration `20261103110000_asset_type_wakandi_fields` to the local development database. API and web typechecks passed after regeneration of the Prisma client.

Exact parity is not claimed for allocation data fields that the local Fixed Asset model does not yet persist.
