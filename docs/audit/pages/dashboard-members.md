# Dashboard Members view

Implemented in `apps/web/src/components/dashboard/members-view.tsx` and `members-charts.tsx`.

## Structure
- Filter bar, Members Growth (Cumulative), eight KPI cards, New Vs Recurring Members, Registered Users Over Time, Churned Users Over Time, four lower charts, and Churned Members by Gender table.

## Data handling
- Growth, registration, gender, age, disability, and impairment charts derive from local clients and `joinedAt`.
- KPI values derive from local clients, loans, and savings accounts.
- Missing savings history shows an unavailable state rather than zero.
- Churn and guarantor-style data is not available locally; empty states are preserved.

## Verification
- `npm run typecheck` passed.
- Dashboard and Clients Playwright specs passed after the change.
- Browser review pending in a visible session.
