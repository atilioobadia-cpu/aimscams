# Recharge Credits visual audit

Date: 2026-11-01
Reference: `F:\Wakandi\messages-recharge-credits\FULL.png`
AIMSCAMS route: `/messages-recharge-credits`

## Comparison

The reference has a Recharge Credits title card and a form containing required Credit and optional Description fields, WBA Balance and Total Cost summaries, and Buy Credits and Cancel actions. The local route was an In Build placeholder.

## Changes and browser review

- Replaced the placeholder with the title card, wallet icon, required amount field, description field, balance/cost summary, and footer actions.
- Added required-field feedback and confirmed the amount field accepts input. Entered `1000` and `Visual QA sample (not submitted)` in the visible browser to inspect the populated control state; these values were not persisted.
- Kept Buy Credits disabled and show the balance and cost as unavailable because the local app has no message-credit pricing, wallet-balance, or purchase API. No purchase or payment flow was opened.
- Reviewed the page in the visible browser at 1280×720.

## Remaining gaps

- Connect an authorized message-credit price and WBA balance source, including validation and total-cost calculation.
- Add an approved payment/purchase flow before enabling Buy Credits.

The form shell is implemented; pricing, balance, and purchase remain tracked in I428.
