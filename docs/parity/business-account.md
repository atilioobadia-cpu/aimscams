# Business Account parity

Reference inspected in the authenticated Wakandi browser at `/core/wba/business-account`. Wakandi remained read-only. The live session later returned to SSO during a page refresh, so this note records the page and computed measurements observed before expiry.

## Shared structure

- The account summary is a white bordered card with an 8px radius. Wakandi measured 983.1 × 95.4px at x=213.4, y=78.1; AIMSCAMS measured 998.7 × 96px at x=213.3, y=78.7 in the local browser.
- The summary keeps identity, wallet figures, status, and actions on one row at desktop widths. AIMSCAMS now switches to this layout at the `lg` breakpoint and uses the institution name and account ID labels.
- The section navigation has six tabs, in this order: Collection and Disbursements, Quick Loan, Expenditure, Transactions, Fee Settings, Invoices. Wakandi tab height was 44.9px; AIMSCAMS measures 45px after the update.
- Search controls use the compact 34px height and six-pixel radius. Table surfaces use the same light slate header treatment and teal controls.

## Behavior and data limits

- Add Funds opens a form with Top Up, Deposit, and QuickLoan Top Up choices, amount, payer, provider, and message fields. The save action is disabled locally until a business account and payment provider are connected. No Wakandi funds were added.
- AIMSCAMS has no connected local source for fees-wallet, due-amount, settlement, invoice, or transaction data. Those fields stay marked unavailable; Wakandi amounts and its invoice/member records were not copied.
- Wakandi's Fee Settings sections are titled Wakandi Business Account, Expense Account, and Liability Account. The local page now uses those titles and the observed explanatory text while leaving ledger values unavailable.

## Remaining data-backed parity work

- Connect the local business-account API to supply the summary figures and each tab's records/actions.
- Once local records exist, compare row actions, invoice actions, filters, and pagination against the live reference. Empty local states cannot establish parity for those controls.
- Do not claim pixel parity for data-bearing states based only on empty local data.
