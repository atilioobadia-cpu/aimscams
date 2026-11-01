# Business Account visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\core-wba-business-account\FULL.png`  
AIMSCAMS route: `/business-account`

## Comparison

The reference capture shows the Add Funds dialog open above the Business Account header, collection/disbursement section, and invoice table. AIMSCAMS now presents the same page structure and opens an Add Funds dialog with Top Up, Deposit, QuickLoan Top Up, Amount, Payer, Provider, Message, Cancel, and disabled Save controls. The local empty table uses the reference invoice columns without copying invoice records.

The visible in-app browser review confirmed the route renders and the dialog opens. The in-app viewport was narrower and shorter than the reference image, so dialog geometry and page-wide pixel parity were not scored. The existing automated score measured a different state and is invalidated pending a canonical same-size recapture.

## Data and workflow limits

- No local business-account API is available for wallet balances, account details, invoice rows, statements, tariffs, or payment providers. Those values are shown as unavailable and the statement action is disabled.
- Save remains disabled; no payment details were entered and no funds or transactions were submitted.
- Tabs are selectable, but the local system does not expose data or workflows for these sections.

## Verification

- `npm run build -w @aimscams/web` passed.
- Opened `/business-account` and the Add Funds dialog in the visible in-app browser.
- No financial workflow was submitted.

Implementation commit: `6a1d7f4` (`feat(web): align business account with Wakandi reference`).
