# Reports parity pass

Status: category hubs compared against live Wakandi and aligned in AIMSCAMS.

## Live reference measurements

At a 1225 by 567 CSS-pixel viewport, Wakandi report hubs use an 8px-radius title card at y=78.10 with 59.58px height, a 20.16px Roboto title and icon, and approximately 20px horizontal padding. Grid cards have 13.44px gaps, 8px radius, subtle shadow, and 13.44px bold labels. The Loan hub is 983.13px wide with 235.70 by 63.83px cards; Savings is 998.46px wide with 239.53 by 63.83px cards because the Loan page's scrollbar reduces its content width. Wakandi uses a separate info action in each card; the action reveals a report description on hover. Clicking the rest of a card opens the report.

The AIMSCAMS app keeps the v1.2.0 body text scale requested by the user (12.8px). The shared report hub uses the measured 59.58px header height, 13.44px grid gap, 63.83px card height, 8px radius, and subtle shadow. The info control is separate from the report link and exposes the description through its help tooltip. Statement Reports use the same shared hub as the other categories.

## Categories inspected

- Savings: Saving Report, Saving Snapshot Report, and Saving Beyond Policy Limits Report.
- Transactions: Daily Transaction Report, Expense Report, Fees Income Report, and Reversed Transaction Report.
- Client: Client List Report and Member Verification Report.
- MSP: 17 report cards from MSP01 through MSP11, including the MFI and Type1/Type2 variants.
- Statement: Account Statement Report and Member Statement Report.

The category titles and report labels follow the live Wakandi wording. MSP uses the visible title `Msp Reports` and labels such as `MSP01 Report` and `MSP03 Type1 Report`. Report descriptions were read from Wakandi's info actions and added to the local cards.

## Data behavior and remaining scope

Wakandi's Saving Report detail opened to `No Saving Report data found` in the live session. A previously captured Wakandi spec documents its date/branch/product filters and an empty report table. AIMSCAMS has its own filter and empty-table view. The live data-empty state did not expose these controls, so exact detail-page control parity remains to be verified on an available populated or fully loaded reference page.

This pass covers report category hubs, their card labels, and description actions. Individual report detail pages still need direct live comparison for filters, table columns, exports, and empty states.
