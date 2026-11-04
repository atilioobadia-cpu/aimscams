# Requests parity record

Reference: authenticated Wakandi `/requests`, inspected in the visible Chrome session. Wakandi stayed read-only.

Local route: `/requests`.

## Measurement setup

- Viewport: 1280 × 590 CSS pixels, DPR 1.5, scale 1.
- Live geometry read with `getBoundingClientRect()` and styles with `getComputedStyle()`.

## Reference measurements

| Element | Wakandi measurement and style |
| --- | --- |
| Header shell | 1280 × 64.667px; white; Roboto 13.44px |
| Sidebar | x 0, y 64.667, w 200px; white |
| Summary card | x 213.438, y 78.104, 1053.125 × 75px; white; 0.667px `#dee2e6` border; 8px radius |
| Title | Roboto 20.16px, weight 600, `#495057` |
| Queue tabs | x 214.104, y 167.208, 1051.792 × 44.875px; active teal `#057573`; inactive `#6c757d` on `#f8fafc` |
| Search | x 240.625, y 235.635, 191 × 34.125px; 0.667px teal border; 6px radius; Roboto 13.44px |
| Request Status control | x 438.344, y 235.240, 146.823 × 34.927px; 0.667px teal border; 6px radius; clear icon appears inside after filtering |
| Add Filters | x 591.885, y 236.635, 132.104 × 32.125px; teal outline; Roboto 11.76px, weight 500 |
| Apply filter icon | x 730.708, y 239.313, 30.240 × 26.771px |
| Results table | x 229.885, y 280.906, 1020.229 × 208.677px |
| Table header | 37.479px high; `#f8fafc`; Roboto 13.44px, weight 700, `#495057` |
| Empty row | 171.198px high |
| Status filter panel | 350 × 290.771px; white; `0.667px solid #e2e8f0`; 6px radius. Condition options: Is, Is any of, Is not, Is none of; status values Pending, Approved, Rejected, Cancelled. Clear and Apply actions. |
| Add Filters menu | x 592.552, y 271.302, 160.156 × 243.854px; searchable, scrollable checkbox list: Request by User, Request Type, Amount, Current Assignee, Approved by, Approval Date, Created Date |

## AIMSCAMS changes

- Matched the summary card, tabs, search, status control, Add Filters button, apply icon, results table, table header, and empty row to live reference measurements at the recorded viewport.
- Recreated the Request Status condition/value panel, clear/apply behavior, and status-condition API support.
- Recreated the searchable, scrollable Add Filters option list and its seven visible options. Request Type opens the existing local input filter.
- Preserved the product-wide 12.8px typography scale required by the v1.2.0 constraint; Requests controls use the measured reference sizes where scoped styling is necessary.
- Wakandi remains read-only; only local list/filter state was used during interaction.

## Remaining differences

- Only Request Type is implemented as a second field filter. The other six Add Filters options are selectable in the visual menu but do not yet have complete local filter-value controls and backend query semantics; do not claim full interaction parity for these options.
- Local status values and table rows depend on the AIMSCAMS dataset. The local empty state cannot reproduce Wakandi production records.
- Typography and shell measurements are sampled at this viewport only. The global 12.8px scale is intentionally retained per the v1.2.0 instruction, so global text is not identical to Wakandi's 13.44px computed base.

## Verification

- Compared both live pages at 1280 × 590 CSS pixels, DPR 1.5, scale 1.
- Opened the local status panel and Add Filters menu; confirmed all seven labels and the Request Type input interaction.
- No production records were edited, created, or exported.
