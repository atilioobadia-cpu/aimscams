# Dashboard Loans view

Implemented in `apps/web/src/components/dashboard/loans-view.tsx` and `loans-charts.tsx`.

## Structure
- Filter bar, three KPI cards, Disbursements by Product, Loan Application Stages, Loans Transactions Amount, and the four loan summary tables.

## Data handling
- KPIs and PAR rows derive from local loans.
- Empty local loan data renders chart frames and table structures without fabricated records.
- Ratios show an unavailable state when their denominator is zero.

## Verification
- `npm run typecheck` passed.
- Dashboard and Clients Playwright specs passed after the change.
- Browser review pending in a visible session.
