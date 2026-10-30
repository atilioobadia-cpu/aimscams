# Phase 3 — live comparison against the reference

Every mapped reference screen was rendered in a real browser and measured, then compared
with the OCR and layout data from Phase 2. This phase produces the evidence the fix plan
(Phase 4) is built on; it changes no application code.

## Method

| Step | Script | Output |
| --- | --- | --- |
| Map each reference screen to an AIMSCAMS route | `tools/audit/build-reference-map.py` | `docs/audit/reference-map.json` |
| Measure every mapped route in Chromium | `tools/ui-audit/page-measure.mjs` | `artifacts/page-measure/*.json` (gitignored) |
| Compare reference and live | `tools/audit/compare.py` | `docs/audit/comparison.md`, `comparison.json` |

The measurement runs at 1280 × 800, device scale 1, with the authenticated session from
`tools/ui-audit/login.mjs`. It records computed styles, bounding boxes, table headers and
row counts, form controls, page actions, pagination, console messages and failed requests.
Text is masked before it leaves the browser: emails become `[email]`, phone-like runs and
10-digit identifiers become `[number]` and `[id]`.

145 reference screens are mapped: 142 have a route, 3 have none with a recorded reason.
140 of the 142 produce a coverage figure; the other 2 (`GeneralLedgerBook`,
`settings-service-provider`) have no text inside the reference content region after OCR.

### What coverage means

Coverage is the share of a screen's reference words that also appear on our page, counted
only over words that recur on **4 or more** reference screens. Recurring words are UI
language — labels, column names, verbs. Words unique to one screen are that screen's demo
data (member names, amounts) and cannot be matched against synthetic records.

The threshold was chosen by measurement, not taste. Across the corpus, df ≥ 2 yields 553
words and admits member names; df ≥ 10 yields 80 words and drops real labels. On four
pilot screens (`messages-send-message`, `accounting-chart-of-accounts`, `clients`,
`transaction-teller-transaction`), df ≥ 4 tracked df ≥ 10 within 3 percentage points while
keeping `template`, `segment`, `type` and `company`. df ≥ 4 is therefore the reported
metric.

Coverage is a screening aid. It under-reports whenever the reference uses a different word
for the same idea (`Teller Transaction` against `Teller console`), and it cannot see a
missing column that happens to share a word with one we have. The screen-level findings
below are the authoritative read; `comparison.md` is the full per-screen data.

## Shell, typography and palette

The reference captures are 1.125× our CSS pixels. Two independent shell dimensions agree
on the factor: 231 / 204 = 1.132 and 76 / 68 = 1.118, and 204 × 1.125 = 229.5 ≈ 231,
68 × 1.125 = 76.5 ≈ 76.

| Property | Reference capture | ÷ 1.125 | Our measurement | Result |
| --- | --- | --- | --- | --- |
| Sidebar width | 231 px | 205 px | 204 px, 140/140 screens | Match within 1 px |
| Header height | 76 px | 68 px | 68 px, 140/140 screens | Exact |
| Accent teal | `#067272` (quantised) | — | `#057573` | Same pixel after quantisation |
| Body text | 22–25 px boxes | ≈ 14 px | 12.8 px | Close; see below |

The shell, palette, control density and row height already match the design. The one ratio
that does not is the page title: a reference title box is about 1.55× the height of a body
box, while our `h1` renders at `--fs`, i.e. 1.0×. `docs/11 §2` currently makes a single
text size a rule, so this is a contract conflict, not a styling bug. Phase 4 must either
record a title size as a deliberate exception or reject the reference's larger title on
evidence. It must not be "fixed" silently.

## Coverage results

| Measure | Value |
| --- | --- |
| Screens compared | 140 |
| Placeholder (`In build`) screens | 68 |
| Implemented screens | 72 |
| Mean coverage, all screens | 28% |
| Mean coverage, implemented screens | 40% |
| Implemented screens below 60% | 60 |
| Table headers under 50% word overlap | 26 |

The highest-scoring implemented screens are the hubs and forms that carry mostly labels:
`/accounting-reports` (94%), `/reports-statement` (80%),
`/account-loan-application-create` (78%), `/accounting-entries` (72%) and
`/account-loan-application-edit/[id]` (71%).

The lowest are either structurally different pages or pages whose reference title is a
member name. Both are informative:

| Route | Coverage | Why |
| --- | --- | --- |
| `/settings/policies/holidays` | 0% | Reference also covers a working-days policy; we ship the holiday list only. |
| `/account-loan-details/[id]/repayments` | 11% | Reference renders a six-column table with an empty state; we render an empty state with no table. |
| `/transaction-teller-transaction-request` | 10% | Reference is a request queue; ours is an ID lookup form. |
| `/settings/policies/credit-product/[id]` | 10% | Reference has eight tabs of structured terms; ours dumps policy JSON. |
| `/import-account` | 13% | Reference has a batch table with nine columns; ours has an empty state only. |
| `/accounting-chart-of-accounts` | 31% | Reference has account groups, opening and closing balances and page actions; ours is a flat 18-row list. |
| `/messages-send-message` | 33% | Reference has type, company, template and segment pickers; ours has channel, recipient and body. |

## Structural findings

### Placeholders

68 mapped screens still render the shared `In build` component: 53 report pages, 10
accounting pages, 4 message pages and 1 business-account page. A placeholder is not a
partial implementation — none of the reference content is present. These are the bulk of
the remaining work and are listed in full in `comparison.md`.

Several placeholder titles render the raw slug or a lower-case fragment: `client
ClientListReport`, `loan ActiveLoanReport`, `msp MSP01Report`, `notes of account`,
`reconcile statement`. That is a presentation defect in the placeholder itself and should
be fixed once, in the shared component, before Phase 5.

### Missing page actions and controls

| Missing | Implemented screens |
| --- | --- |
| `Actions` column where the reference has one | 7 |
| A primary add action where the reference has `Add` | 16 |
| Search or filter where the reference has `Search` | 23 |
| Pagination on a table with more than 10 rows | 4 |

The pagination count needs a decision rather than a blanket fix. The four screens are the
chart of accounts and three financial statements (financial position, income statement,
trial balance). The reference paginates none of them: statements are read whole, and the
chart of accounts shows every group. The standing requirement — paginate after 10 rows —
therefore conflicts with the reference on statements. Phase 4 should scope pagination to
list screens and record why statements are exempt.

### Runtime health

Across the 142 captured routes: **0 console errors, 0 warnings and 0 failed requests**.
Every route returned 200. The defects in this report are completeness and presentation
defects, not crashes.

## Screen-level findings

These were read by hand against the reference text, because coverage alone cannot express
them.

### Chart of accounts

The reference is a grouped chart: group rows (`Assets`, `Liabilities and Owners Equity`,
`Capital Account`, `Incomes`, `Expenses`) with an opening balance and a closing balance
per row, a date range, `Add Groups` and `Add Ledgers`, and a warning when opening balances
do not net to zero. Ours is a flat list of 18 postable accounts with columns `Code`,
`Account`, `Type`, `Normal side`, `Postable`, no group rows, no balances, no actions, no
search and no page actions. The 115 missing accounts from Phase 1 are the same gap seen
from the data side.

### Teller approval request

The reference lists queued requests with `Date`, `Request`, `Status`, `Requester`,
`Current assignee`, `Approved by` and a row menu. Ours asks the operator to paste a
request ID into a text box. There is no queue, no list and no way to discover a request
without already knowing its identifier.

### Loan detail tabs

The reference keeps `Summary`, `Transactions`, `Schedule`, `Repayments`, `Charges`,
`Guarantors`, `Documents` and `History` as tabs on one loan, and each empty tab still
renders its column headers above the `No data available` row. Ours splits them into
separate routes, omits schedule and charges, and shows a bare empty state with no table
headers. The missing schedule page is also one of the three unmapped reference screens.

### Import pages

The reference batch list has `Id`, `File`, `Batch reference id`, `Date`, `Template`,
`Type`, `Status`, `Total records`, `Uploaded records`, `Uploaded by`, plus search and
filters. Ours shows a count, a `New import` button and an empty state. The empty state is
correct; the table structure around it is missing, so the page will stay unreadable once
batches exist.

### Send message

The reference composes from `Type`, `Company`, `Template` and `Segment` selectors with
`Send message`, `Cancel` and `Test message`. Ours is a free-text form with `Channel`,
`Recipient` and `Message body`. Templates and segments exist as settings; the composer
does not use them.

### Credit product policy detail

The reference shows eight tabs — `Terms`, `Settings`, `Interest`, `Repayments`,
`Guarantors and Collateral`, `Loan charges`, `Loan stages`, `Accounting setting` — with
minimum and maximum amount, tenure, grace period, approval stage and status. Ours prints
the policy's raw JSON in a `<pre>` block. This is the clearest single presentation defect
found in the phase.

### Holiday calendar

The reference page covers both a working-days policy (which weekdays are working days)
and the holiday list. Ours ships the holiday list only, so due-date calculation has no
working-days input to read.

### Clients

`Add client` and `Add group` exist, but there is no group detail screen; the reference has
one (`clients-group-1789`), so it is unmapped rather than placeheld. Client groups
therefore cannot be opened, edited or seen after creation.

## Limits of this comparison

- **OCR title noise.** The title is read from the largest text box in the band `y 100–180`,
  `250 < x ≤ 700`. Titles that are all-caps, numeric, longer than 60 characters or contain
  a run of three or more digits are replaced with `[unreadable]` and are **not** counted as
  `title differs`. The band bound exists because on `clients` the widest box is the header
  control `CllentActivationLink`, not the page title.
- **A tab can pass for a title.** On `/settings/policies/holidays` the largest box in the
  band is the `Holidays` tab in the settings sub-navigation (x = 643), not the page title.
  The clean title therefore reads `Holidays` while our page is called `Holiday calendar`.
  It is one screen; treat it as noise, not a naming defect.
- **Reference data is filtered, not published.** Tokens that appear in all-caps runs are
  skipped, because the observed product shouts member, staff and branch names while it
  writes labels in sentence case. This keeps the committed report free of personal data.
  A handful of staff names survive in title case, so the word-level diff
  (`comparison-words.json`) is gitignored and only counts, cleaned titles and cleaned
  column names are published.
- **Nav leakage.** The content filter (`x > 250`, `y > 84`) still admits a few nav or
  breadcrumb fragments on pages where a label is wider than 250 px. It affects coverage by
  a word or two, not the conclusion.
- **Two screens without coverage.** `GeneralLedgerBook` and `settings-service-provider`
  produced no reference text in the content region; they were inspected from their specs
  instead.

## Outputs

| File | Committed | Contents |
| --- | --- | --- |
| `docs/audit/reference-map.json` | yes | 145 slugs → route, with reasons for the 3 absent |
| `docs/audit/comparison.md` | yes | full per-screen report |
| `docs/audit/comparison.json` | yes | the same data, machine-readable, without the word-level diff |
| `docs/audit/comparison-words.json` | no | word-level diff; quotes a few reference names |
| `artifacts/page-measure/` | no | 142 raw captures containing masked page text |

## Next

Phase 4 turns this into `docs/audit/fix-plan.md`, ordered by user impact and dependency:
the shared placeholder and the chart-of-accounts data model first (both unblock many
screens), then the report families, then the settings and message pages. Two decisions
must be recorded before implementation: the page-title type size, and the pagination scope
for statements.
