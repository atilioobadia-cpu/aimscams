# Dashboard visual audit

## User-supplied screenshot baseline — 2026-11-01

The user supplied 22 read-only reference screenshots from `F:\aimscams_snapshots`. This baseline supersedes the earlier note that screenshot use was excluded. All images were reviewed; they show Overview, Members, Loans, vertical scroll positions, filter value menus, and the date picker. Files are `Screenshot 2026-11-01 175206.png`, `175258.png`, `175321.png`, `175347.png`, `175357.png`, `175408.png`, `175416.png`, `175426.png`, `175435.png`, `175443.png`, `175455.png`, `175507.png`, `175518.png`, `175526.png`, `175533.png`, `175542.png`, `175551.png`, `175608.png`, `175617.png`, `175626.png`, `175633.png`, and `175644.png`.

### Visual contract from the supplied Dashboard screens

- Desktop reference viewport: 1920 × 1080. Header is about 96px high, expanded navigation about 300px wide, and the content inset is about 20px.
- The dashboard view card is about 105px high; each active tab is about 154 × 44px. The active tab and filter controls use the MFSL teal; inactive tabs stay on white.
- KPI cards are about 185px high with a 60px circular icon badge. Keep the AIMSCAMS v1.2.0 font scale (`--fs: 12.8px`) intact.
- Member and loan tabs begin with a 124px filter card containing six 54px outlined controls. Value filters use a condition/value popover with search; Date uses a calendar with Clear and Apply.
- Overview uses four KPIs, a full-width funds chart, then two side-by-side portfolio/risk charts. Members uses growth, eight KPIs, three full-width trends, two pairs of demographic charts, and the churn table. Loans uses three KPIs, two charts, a full-width transactions chart, then four full-width insight tables.
- Cards use a white surface, thin cool-gray borders, subtle corner rounding, and restrained shadows. Chart series use teal, terracotta, yellow, and slate. No production figures, member names, or other record values were copied into AIMSCAMS.

### AIMSCAMS adjustments made

- Matched the shared shell dimensions, header logo scale, dashboard tabs, KPI card geometry, chart spacing, member/loan section order, and filter popover/date-picker controls to the screenshot structure.
- Added the user-provided MFSL logo at `apps/web/public/brand/mfsl_logo_systm.jpg` as the round header logo fallback.
- Aligned the age filter buckets with the reference bands (`<25`, `25-34`, `35-44`, `45-54`, `55+`, and undefined) and added single-date filtering.
- The visible AIMSCAMS browser remains open on `/dashboard`. The browser screenshot verified the updated shell, MFSL logo, Overview tab, and KPI sizing. The in-app browser is narrower than the 1920px reference, so desktop pixel parity for the full-width layout is not directly verified here.

### Data and verification limits

- Local Members has limited history and local Loans has no records. Member growth uses available join dates; unsupported chart histories show a local-data unavailable state. No sample records were added.
- Overview values remain existing synthetic dashboard fixtures, not live local aggregates. Numeric parity with the production screenshot is not claimed.
- `npm run typecheck` reports TypeScript errors only in the pre-existing user-modified `apps/web/src/app/(app)/clients/create/page.tsx`; no Dashboard or logo errors appeared. That unrelated file was left unchanged.

**Reference inspected:** Wakandi live dashboard at `https://cams.wakandi.co.tz/dashboard`, 2026-11-01. The session was authenticated and used read-only. Chrome zoom was 90%. Overview, Members, and Loans dashboard tabs were inspected.

## Layout match

- Shared shell: 96px header and 300px expanded navigation rail at the supplied desktop reference viewport; retain the v1.2.0 font scale.
- Dashboard view card: 105px high, with three 154px by 44px view tabs.
- Overview: four KPI cards at about 185px high, followed by the funds chart and two side-by-side portfolio/risk charts. The reference dashboard has no unposted-transaction banner or branch/date strip inside the dashboard view card.
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

## Historical live-session re-review — 2026-11-01

At that point screenshots were excluded per an earlier user instruction, which the user has since superseded by supplying the screenshot set documented above. Read the active Wakandi `/dashboard` accessibility tree directly: it exposes Overview, Members, and Loans tabs, the institution/language/branch/user header, and the funds, savings/shares/loans, and PAR dashboard sections. The visible AIMSCAMS `/dashboard` exposes the same three views and corresponding sections. Members and Loans are data-limited locally as recorded above; no sample records were added.

This historical session confirmed structural navigation and section labels. The current screenshot-based review is the source for visual measurements; production metric values were not copied.
