# Cash Flow Statement visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\accounting-reports-CashFlowStatement\FULL.png`  
AIMSCAMS route: `/accounting-reports-CashFlowStatement`

## Comparison

Both pages include a date period and cash movement information. The reference is a full cash-flow statement grouped into operating, investing, and financing activities, with working-capital adjustments, opening/closing cash, and prior-year amounts. AIMSCAMS shows cash-in, cash-out, net movement, and a Cash on Hand movements table. It does not expose the activity sections or comparative values shown by the reference.

The local response is a movement summary rather than the comparative cash-flow schedule. Rebuilding the reference table from that summary would imply calculations the backend does not provide.

## Browser review

Compared the default local date-range and zero summary with the supplied reference in the visible browser/image viewer. No transactions were posted and no report export was triggered. No reference financial values were copied.

## Recommendations

- Extend the reporting API to return cash-flow categories, adjustments, period totals, and prior-year comparatives.
- Keep the current movement view until the expanded report data is available.

Implementation commit: none; cash-flow report model gap.
