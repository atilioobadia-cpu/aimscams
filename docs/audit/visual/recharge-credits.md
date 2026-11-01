# Recharge Credits visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\messages-recharge-credits/FULL.png`  
AIMSCAMS route: `/messages-recharge-credits`

## Comparison

The reference has a Recharge Credits title card and a form for credit amount and description, plus WBA balance, total cost, Buy Credits, and Cancel. AIMSCAMS shows an In Build state with no form or balance details.

## Recommendations

- Implement the amount/description form with validated pricing and a clear balance/cost summary. Keep the purchase action connected only to an approved payment flow; no purchase was attempted during this audit.
- Match the AIMSCAMS title/action card, field spacing, typography, and teal action styles to the shared UI contract.

Browser review was read-only; no credit purchase or segment save was activated.  
Implementation commit: none; Message-credit pricing and purchase workflow are not implemented.
