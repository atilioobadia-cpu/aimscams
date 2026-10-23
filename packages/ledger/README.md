# `@aimscams/ledger`

The book. Chart of accounts, posting policies, journal entries, journal lines and the trial
balance. Amounts are integer **minor units** (TZS × 100) from the domain all the way into
PostgreSQL — never a float, never a decimal string in between.

## The database enforces the rules

Nothing below depends on application code remembering to check it.

| Rule | Enforced by |
|---|---|
| Every entry balances | Deferred constraint trigger at commit, so an entry and its lines can be written in any order |
| An entry has at least two lines | Same trigger |
| A line is exactly one of debit or credit, never both, never neither | `check ((debit_minor = 0) <> (credit_minor = 0))` |
| A posted entry and its lines are immutable | `before update or delete` triggers; corrections are reversing entries |
| An entry can only be written into an **open** period, dated inside it | `before insert or update` trigger on `journal_entry` |
| A line cannot reference another tenant's entry or account | Composite foreign keys `(id, tenant_id)` |
| Tenants only see their own rows | Row-level security, **forced** on the table owner |

Deferred balance checking is the important one: it means the engine writes the entry, then the
lines, then flips the entry to `posted` — and if anything is wrong the *commit* fails. A
half-posted entry cannot exist, even after a crash.

## Tables

| Table | Purpose |
|---|---|
| `tenant` | SACCO (`SACCOS`) or microfinance (`MFI`) — the dialect drives reporting |
| `branch` | Includes `council_type` (CC / MC / DC / TC) for MSP07 and MSP10 |
| `fiscal_period` | `open` or `closed`; the period guard reads it |
| `gl_account` | Chart of accounts; `is_assumption` marks rows no screenshot confirmed |
| `posting_policy` | Event → lines, versioned. Rules are data, not code (D-005, D-015) |
| `journal_entry` | Header: date, period, event, source, idempotency key, status |
| `journal_line` | `debit_minor` or `credit_minor`, never both |

## Posting

By event, using the tenant's policy rows — the normal path:

```ts
await postEvent(db, {
  tenantId,
  entryDate: '2026-10-07',
  eventCode: 'LOAN_REPAYMENT',
  sourceType: 'loan_repayment',
  sourceId: repaymentId,
  idempotencyKey: `repayment:${repaymentId}`,
  amounts: {
    total: fromMajor('1200.00'),
    principal: fromMajor('1000.00'),
    interest: fromMajor('200.00'),
  },
});
```

Explicit lines, for events with no policy row yet:

```ts
await postEntry(db, {
  tenantId,
  entryDate: '2026-10-07',
  eventCode: 'ADJUSTMENT',
  sourceType: 'manual',
  sourceId: 'adj-1',
  idempotencyKey: 'manual:adj-1',
  lines: [
    { account: '1002', debitMinor: 50_000n },
    { account: '5502', creditMinor: 50_000n },
  ],
});
```

Both return `{ id, entryNo, reused }`. A repeated idempotency key returns the original entry with
`reused: true` instead of posting a second one.

Policy lines name an amount key (`total`, `principal`, `interest`, `penalty`, `charges`); a key
that is missing or zero is skipped, which is how a repayment with no penalty still balances.

## Provisioning a tenant

One transaction creates the tenant, its head-office branch, its fiscal periods, the chart of
accounts and the posting policies:

```ts
const { tenantId } = await provisionTenant(db, {
  code: 'DEMO1',
  name: 'AIMS Demo SACCO',
  dialect: 'SACCOS',
  branch: { code: 'HQ', name: 'Head office', councilType: 'MC' },
  periods: [{ startsOn: '2026-01-01', endsOn: '2026-12-31' }],
});
```

It is idempotent by tenant code, so a retried deployment adds what is missing instead of
creating a second book. Overlapping periods are refused before anything is written — a day may
belong to only one fiscal period.

## Trial balance

```ts
const balance = await trialBalance(db, tenantId, '2026-10-31');
// balance.rows: one row per account, debit, credit, and balance on its normal side
// balance.debitMinor === balance.creditMinor, or the call throws
```

Entries dated after the report date are excluded. The report refuses to return numbers that do
not tie out — a failing trial balance is an exception, not a table with a footnote.

## Seeding a tenant

```ts
await seedChartOfAccounts(db, tenantId);
await seedPostingPolicies(db, tenantId);
```

The chart follows the observed ledger's codes where they were captured (`1002`, `1005`, `1201`,
`1505`, `2004`, `3404`, `4101`, `4104`, `5004`, `5502`). Two rows are marked assumptions because
no screenshot showed them: `2101 Member savings` and `5001 Interest expense — member savings`.

`LOAN_REPAYMENT` is also flagged `is_assumption`: the observed ledger debits an income account,
which is not standard double entry, and it uses the staff-loan ledger as the receivable. The
template posts the standard direction; the note on the policy row records the discrepancy.
Correcting it is a new policy version, never an edit to posted history (D-017).

## Assumptions and gaps in this slice

- Reversals are modelled (`reversal_of`) but have no helper yet.
- Period close is a manual `update`; the month-end job is not written.
- Accrual, provisioning (O-002) and write-off approval flows are not posted here yet.
- The outbox and worker that will call `postEvent` live in the API package, not in this one.

## Running the tests

```powershell
npm test -w @aimscams/ledger
```

Thirteen cases cover the constraints (unbalanced, single-line, both-sides, immutability, closed
period, date outside period, unknown account, idempotency), provisioning (idempotent, overlapping
periods refused), a five-day scripted week that ties out to the cent, date-bounded reporting, and
tenant isolation under a non-superuser role.

Each case starts a fresh **PGlite** database — PostgreSQL in WASM — and applies the real
`schema.sql`. Staging and production run the same file against PostgreSQL 16. See D-016.
