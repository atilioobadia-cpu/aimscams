# Dashboard visual audit

**Reference inspected:** Wakandi live dashboard at `https://cams.wakandi.co.tz/dashboard`, 2026-11-01. The session was authenticated and used read-only. Chrome zoom was 90%. Overview, Members, and Loans dashboard tabs were inspected.

## Layout match

- Shared shell: 64px header and 200px expanded navigation rail at the desktop comparison viewport; keep the existing v1.2.0 font scale.
- Dashboard view card: 70px high, with three 102px by 30px view tabs.
- Overview: four KPI cards at a 124px minimum height, followed by the funds chart and two side-by-side portfolio/risk charts. The reference dashboard has no unposted-transaction banner or branch/date strip inside the dashboard view card.
- Members and Loans: six filters (Branch, Gender, Age, Client Type, Product, Date) above the analytics content.
- Members: cumulative growth chart, eight KPIs, the member breakdown charts, and churn table.
- Loans: three KPIs, two first-row charts, a full-width transaction chart, and four insight tables.

## Local data limits

- The local Members view returned one existing member record. The local Loans view returned no loan records. No records were added for this comparison.
- Member growth is calculated only from local join dates. Other trends, loan analytics, and risk ratios display an unavailable state when local history is absent. The growth chart axis now derives from its local points instead of using a fixed production-sized scale.
- Existing overview totals and funds bars are synthetic dashboard fixtures, not live local aggregates. Their values are not evidence of data parity and were not changed as part of this visual pass.

## Follow-up

- Wire overview totals and funds history to local aggregate endpoints before evaluating numeric parity.
- Revisit empty chart/table states when local loan and member history is available; do not seed more than five sample records.

## Live-session re-review — 2026-11-01

Screenshots are excluded from this pass per the user's instruction. Read the active Wakandi `/dashboard` accessibility tree directly: it exposes Overview, Members, and Loans tabs, the institution/language/branch/user header, and the funds, savings/shares/loans, and PAR dashboard sections. The visible AIMSCAMS `/dashboard` exposes the same three views and corresponding sections. Members and Loans are data-limited locally as recorded above; no sample records were added.

The active session confirms the dashboard's structural navigation and section labels. Pixel-level measurements are not scored in this pass because screenshot use is prohibited and the reference corpus has no Dashboard image folder. Production metric values were not copied.
