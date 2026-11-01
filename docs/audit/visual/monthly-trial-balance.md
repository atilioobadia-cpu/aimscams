# Monthly Trial Balance visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\accounting-reports-MonthlyTrialBalance\FULL.png`  
AIMSCAMS route: `/accounting-reports-MonthlyTrialBalance`

## Comparison

The reference provides a month selector and a grouped account table with debit/credit columns for prior month-end, current month activity, and current closing balance. It also has period exports and an opening-balance alert. AIMSCAMS instead uses an as-of-date control and renders the same flat account balances as the other trial-balance views; monthly movements, prior-month balances, hierarchy, and exports are not present.

## Browser review

Compared the local monthly route with the supplied reference in the visible browser/image viewer. No exports or accounting writes were performed, and reference amounts were not copied.

## Recommendations

- Add monthly opening, movement, and closing values by account group and ledger to the report API.
- Replace the as-of-date control with a month selector after the API supports period-specific data.

Implementation commit: none; monthly report data contract gap.
