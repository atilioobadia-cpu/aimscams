# Visual spot-check index

Date: 2026-11-01
Scope: visual comparison plus the shared-shell and Clients adjustments recorded in [clients](clients.md).

Reference captures are stored at F:\Wakandi. AIMSCAMS was inspected in the visible in-app browser; page-specific viewport measurements are recorded in each audit. Reference screenshots have a 1838 px content width on list pages, with screenshot scale calibrated individually. Authentication captures are about 1830 × 930 px. Exact pixel and perceptual metrics remain pending calibrated, same-state captures.

| Page | Reference | Visual finding | Data/reference limitation |
|---|---|---|---|
| Authentication | `authentication/` (three state screenshots) | Shared green and white palette; login structure and brand mark differ. See [authentication](authentication.md). | Reference contains capture-toolbar/CAPTCHA overlays. It has login, recovery-email, and password-reset states, not a stitched `FULL.png`. |
| Clients | `clients/FULL.png` | Shared shell and list structure adjusted; activation-link behavior and data count remain different. See [clients](clients.md). | Local list has one synthetic individual record; avoid data-dependent comparisons. |
| Loans | `account-loan/FULL.png` | Title, tabs, toolbar, table structure, horizontal scroll, and pager aligned; see [loans](account-loan.md). | No local loan records; saved-filter persistence remains unavailable. |
| Loan applications | `account-loan-application/FULL.png` | Title/action card, status tabs, filter toolbar, and table structure aligned; see [loan applications](loan-applications.md). | No local application rows; workflow stage and saved-filter persistence are not available. |
| Loan application create | `account-loan-application-create/FULL.png` | Title card and accordion sections aligned; see [loan application creation](loan-application-create.md). | Edit state and hover/focus states still need review; interest-on-grace control differs. |
| Loan application details | `account-loan-application-details-39/` and `account-loan-application-details-124/` | Reference layout reviewed; local workflow/history model does not expose the same detail state. See [loan application details](loan-application-details.md). | No matching local UUID record; stage assignment/history model unavailable. |
| Loan application edit | `account-loan-application-edit-39/FULL.png` | Shared wizard now starts on Additional Details and uses an Update title; see [loan application edit](loan-application-edit.md). | Populated state cannot be compared without a local UUID record; interest-period fields differ. |
| Savings accounts | `account-saving/FULL.png` | Title/action card, empty table structure, and modal proportions aligned; see [savings accounts](account-saving.md). | No local rows; Account Name is absent from the local model. |
| Loan details summary | `account-loan-details-118-summary/FULL.png` | Reference header, tabs, balance and detail sections differ from the limited local summary; see [loan summary](loan-details-summary.md). | Reference loan ID cannot load locally; no local loan rows. |
| Loan schedule | `account-loan-details-118-schedule/FULL.png` | Missing local route added with available schedule fields; see [loan schedule](loan-details-schedule.md). | Local API lacks several reference transaction and payment columns; no matching UUID loan. |
| Loan transactions | `account-loan-details-118-transactions/FULL.png` | Reference state reviewed; see [loan transactions](loan-details-transactions.md). | No matching local UUID loan or transaction rows. |
| Loan repayments | `account-loan-details-118-repayments/FULL.png` | Reference state reviewed; see [loan repayments](loan-details-repayments.md). | No matching local UUID loan or posted repayment rows. |
| Loan documents | `account-loan-details-118-documents/FULL.png` | Reference state reviewed; see [loan documents](loan-details-documents.md). | No matching local UUID loan or document rows. |
| Loan guarantors | `account-loan-details-118-guarantors/FULL.png` | Reference state reviewed; see [loan guarantors](loan-details-guarantors.md). | No matching local UUID loan or guarantor rows. |
| Dashboard | None found | Cannot score visual similarity without a reference capture. See [dashboard](dashboard.md). | `F:\Wakandi\dashboard\FULL.png` is absent. |

The folder index and manifest disagree about inventory totals: the index claims 438 originals, while the manifest contains 576 rows and the current scan sees 576 PNGs plus one JPG. Reconcile the manifest before using corpus totals in a final audit score.
