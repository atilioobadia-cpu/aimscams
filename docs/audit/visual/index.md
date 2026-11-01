# Visual spot-check index

Date: 2026-11-01
Scope: visual comparison plus the shared-shell and Clients adjustments recorded in [clients](clients.md).

Reference captures are stored at F:\Wakandi. AIMSCAMS was inspected in the visible in-app browser; page-specific viewport measurements are recorded in each audit. Reference screenshots have a 1838 px content width on list pages, with screenshot scale calibrated individually. Authentication captures are about 1830 × 930 px. Exact pixel and perceptual metrics remain pending calibrated, same-state captures.

| Page | Reference | Visual finding | Data/reference limitation |
|---|---|---|---|
| Authentication | `authentication/` (three state screenshots) | Shared green and white palette; login structure and brand mark differ. See [authentication](authentication.md). | Reference contains capture-toolbar/CAPTCHA overlays. It has login, recovery-email, and password-reset states, not a stitched `FULL.png`. |
| Clients | `clients/FULL.png` | Shared shell and list structure adjusted; activation-link behavior and data count remain different. See [clients](clients.md). | Local list has one synthetic individual record; avoid data-dependent comparisons. |
| Loans | `account-loan/FULL.png` | Title, status tabs, toolbar, table structure, horizontal scroll, and pager aligned; see [account-loan](account-loan.md). | No local loan records; saved-filter persistence remains unavailable. |
| Dashboard | None found | Cannot score visual similarity without a reference capture. See [dashboard](dashboard.md). | `F:\Wakandi\dashboard\FULL.png` is absent. |

The folder index and manifest disagree about inventory totals: the index claims 438 originals, while the manifest contains 576 rows and the current scan sees 576 PNGs plus one JPG. Reconcile the manifest before using corpus totals in a final audit score.
