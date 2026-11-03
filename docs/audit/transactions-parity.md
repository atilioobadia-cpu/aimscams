# Transactions parity checkpoint

## AIMSCAMS navigation

The Transactions sidebar exposes the same three destinations as Wakandi, in this order:

1. Teller → `/transaction-teller-transaction`
2. Online → `/transaction-online-transaction`
3. All → `/transaction-all-transaction`

Teller History, Requests, and Online Reconciliation remain available as page actions/routes rather than sidebar children.

## Wakandi live reference

The visible Chrome session rendered Teller, Online, and All during this review. All observations were read-only; no production filters, records, or teller actions were changed.

### Teller

- Page title: `Teller Transaction` in a compact white bordered title card.
- Header includes the teller-session status and branch; the right side shows branch status and balance.
- Tabs are `New Transaction`, `History`, `Requests`.
- F12 at the current desktop viewport measured the title at 20.16px/600, and the tabs at 44px high. Widths: New Transaction 140px, History 80px, Requests 94px. The active tab is white with teal text/bottom border; inactive tabs use a pale gray background and muted gray text.
- New Transaction begins at `Choose Category` and shows four cards: Client Transaction, General Ledger, Till Administration, Bulk Transaction. The Client Transaction path has a follow-up transaction-type choice and then a required account/client lookup form.
- History includes search, date-range/teller filters, export, and a transaction table. Requests shows request/status/assignee columns and an empty state when there are no rows.
- No category selection led to a submitted transaction. No account/client lookup was populated and no production action was submitted.

### Online

- Compact title card: `Online Transactions`, with `Initiate Online Transaction` and `Online Transaction Reconciliation` actions.
- Filter row contains Search, Payment Transaction Status, Start Date, End Date, save-filter, and clear-filter controls.
- Table columns: Creation Date, Client Name, Account Number, TransactionReferenceID, External Id, Payment Provider, Transaction Type, Status, Reconciled, Amount (TSh), plus a column-settings control.
- F12 measurements: heading 20.16px/600; action buttons 29px high with teal text/border and 6px radius; search input 34px high; filter controls 35px high; table header 37px high with 13.44px/700 text, pale gray fill, and 10.08px × 13.44px cell padding.
- AIMSCAMS transaction data does not currently expose Payment Provider or reconciliation state as separate fields. Those cells should remain neutral placeholders until backed by real local fields; do not infer reconciliation from accounting-posting status.

### All

- The live page has Search, Date, Transaction Status, Add Filters, save-filter and clear-filter controls, plus columns for date, session date, member, transaction/account numbers, type, amount, status, reference, product, source, comment, and user.
- Wakandi displayed a notice about transactions pending accounting posting and a `Resubmit` action. This production action was not clicked.
- No transaction rows were copied into the audit notes.

## AIMSCAMS parity changes in this pass

- Shared the title card and the three measured Teller tabs across New Transaction, History, and Requests.
- Reworked New Transaction into the same three stages as Wakandi: choose one of four categories, choose a category-specific type, then enter details. Till open/close controls appear only in Till Administration.
- Teller History now uses the local transaction list and Wakandi's 13 transaction columns, with search, date range, and CSV export. Requests remains on its existing request table.
- Reworked Online to the reference title/actions/filter/table structure. The existing create-collection flow remains available in a modal; Reconciliation links to its existing workspace.
- Preserved the v1.2.0 global font-size tokens. Local tab/body text uses the existing app token rather than increasing global typography.
- No Teller transaction, till opening/closing, reconciliation, or online collection was submitted.

## Remaining local data gaps

- The AIMSCAMS transaction API type has no distinct Payment Provider or reconciliation fields. Online renders neutral placeholders for these columns rather than deriving them from payment method or accounting status.
- The existing web client has no Teller account lookup endpoint. The savings form presents a required `Search Account` input using the account ID field; it cannot provide Wakandi's selectable account search until a local lookup API is available.
- The local browser showed `Failed to fetch` for Teller till summary data during this pass, so the shared title card correctly displays unavailable local balance/session details. Layout verification was still possible.
- The local reference dataset returned an empty history and requests table. No production row values were copied into notes.
