# Chart of Accounts parity

Reference: authenticated Wakandi Chart of Accounts inspected in the user's visible Chrome session with DevTools measurements. Wakandi was read-only throughout. No production data or settings were changed.

## Measurement setup

- Viewport: 1280 × 590 CSS pixels; device pixel ratio 1.5; visual viewport scale 1.
- Values were read with `getBoundingClientRect()` and `getComputedStyle()` from the live page.
- The browser session was reauthenticated for this pass. The current page exposes two header actions: Add Groups and Add Ledgers.

## Reference measurements

| Element | Measured reference |
| --- | --- |
| Header card | x 220.156, y 84.823, w 1024.354, h 70.417 px; white; `0.667px solid #dee2e6`; 8px radius; 20.16px padding |
| Page title | x 267.865, y 105.646, w 164.292, h 24.667 px; Roboto 20.16px/normal, weight 600, `#495057` |
| Add Groups | x 707.969, y 105.646, 105.417 × 28.771 px; Roboto 11.76px, weight 500; `#057573`; `0.667px` border; 6px radius; padding 6.72px 8.4px |
| Add Ledgers | x 820.104, y 105.646, 110.146 × 28.771 px; same button styles |
| Button hover | solid `#057573` background, white text, same teal border and 6px radius; 0.2s background/color/border/outline/shadow transitions; no shadow |
| Opening-balance alert | x 220.156, y 168.677, w 1024.354, h 36.146 px; `#dc2626` text; 6px radius; padding 10.08px 13.44px; alert background is pale red |
| Table header frame | x 220.823, y 218.927, w 1023.021, h 40.813 px; row starts x 222.823, y 220.927 and is 1019.021 × 36.813 px |
| Table body frame | x 220.823, y 259.740, w 1023.021 px; first row x 222.823, y 261.740, w 1019.021, h 44.323 px; row-to-row pitch 46.323px |
| Header cells | Roboto 13.44px, weight 700, `#495057`, white background, 10.08px padding |
| Body cells | Roboto 13.44px, weight 400, `#495057`, white background, padding 10.08px 13.44px; 0.2s transitions. Tested row hover remained white. |
| Tree expander | 23.51 × 23.51px; 14px icon; 16px indent for each nested level |
| Add Groups dialog | 672 × 397.177px at x304, y96.406; white; `0.667px solid #e2e8f0`; 12px radius. Fields: Group name, Parent group, Group Code. Controls about 35px high. Cancel and Save are each 100 × 34.125px. |
| Add Ledgers dialog | 672 × 531px at x304, y29.5; white; content scroll area 398px high with 1027px scroll height; fixed footer. Fields include Ledger name, Parent group, Code, Opening Balance and Dr/Cr selector, Opening Date, Bank or cash account, Reconciliation, Category, Maturity Date, Notes, Unique ID, and Category. Required fields were left blank and Save was not submitted. |

The two table elements are separate in Wakandi. Header and body columns use slightly different widths, so the local page also uses separate header/body tables.

## Local implementation status

Rechecked the local page at the same viewport after the latest style changes:

| Element | AIMSCAMS measured value | Difference from reference |
| --- | --- | --- |
| Header card | x 220.188, y 84.792, w 1024.365, h 70.396 px | each geometry value is within 0.04px |
| Title text | x 267.865, y 105.656, w 158.760, h 24.667 px | position/height within 0.02px; text width is 5.53px narrower and needs font-rendering review |
| Add Groups / Add Ledgers | x 708.010 / 820.146, y 105.604 px; measured widths/heights match to 0.04px | position within 0.05px |
| Table header/body frames | x 220.823; w 1023.021px; header/body y 218.906 / 259.708px | x/width exact; y within 0.04px |
| Table cell geometry | Header and first-row cell positions/widths match reference to under 0.1px | within 0.1px |
| Tree controls | root x 236.260px; child x 252.260px; 23.5px square | x exact; vertical offset about 0.02px |
| Button hover | solid `rgb(5,117,115)`, white text, same border/radius, no shadow | matches the measured reference state |
| Alert | x 220.188, y 168.667, w 1024.365, h 36.146 px; rgba(254,242,242,.95); `#dc2626` | geometry within 0.04px; color and padding match |

The tree walks actual parent/child relationships and indents each level by 16px. Existing database hierarchy and balances are read-only during this inspection; no accounting records were created or edited.

## Remaining COA work

- Add Groups and Add Ledgers are still placeholders in AIMSCAMS; implement their forms and tenant-scoped API behavior before calling COA complete.
- The ledger edit action still displays a placeholder toast. Do not directly mutate opening balances; use a balanced, auditable journal adjustment if opening-balance changes are supported.
- The local title text width is narrower than Wakandi despite the same declared font size/family. Confirm actual Roboto font rendering in a production build before claiming typography parity.
- Do not claim pixel-complete parity until typography and responsive states are reviewed, and the add/edit actions are implemented and checked locally.
