# Reports parity pass

Status: category hubs compared against live Wakandi and aligned in AIMSCAMS.

## Live reference measurements

At a 1225 by 567 CSS-pixel viewport, Wakandi report hubs use a title card at x=213.44, y=78.10, w=998.46, h=59.58. The card has an 8px radius, 20px horizontal padding, a 20.16px Roboto title, and a 20.16px icon. The report grid begins at y=151.13 with 13.44px gaps. Each four-column report card measures 239.53 by 63.83px, has an 8px radius and subtle shadow, and uses a 13.44px bold label. Wakandi uses a separate info action in each card; the action reveals a report description on hover. Clicking the rest of a card opens the report.

The AIMSCAMS app keeps the v1.2.0 text scale requested by the user. Its report hub header is now 59px high and the local grid uses the measured 13.44px gap. At the same viewport, card positions and widths align within 1px, and card heights are 65.17px. The info control is separate from the report link and exposes the live description as a native help tooltip. Statement Reports now use the same shared hub as the other categories.

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
