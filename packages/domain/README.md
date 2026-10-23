# `@aimscams/domain`

The part of AIMSCAMS that must be right before anything else exists: how money is
represented, how a loan is scheduled, how a payment is split, and how arrears age.

Pure TypeScript. No database, no framework, no I/O, no clock it does not receive as an
argument. Everything here is deterministic, which is why it is testable in milliseconds
and why the ledger can be trusted later.

```bash
npm test --workspace @aimscams/domain
npm run typecheck --workspace @aimscams/domain
```

## What is in here

| Module | Responsibility | Invariant it guarantees |
|---|---|---|
| `money.ts` | Integer minor units, exact rational rates, weighted splits | A split never loses or creates a unit |
| `schedule.ts` | Equal instalment, equal principal, flat | Principal parts sum to the amount disbursed; closing balance ends at zero |
| `allocation.ts` | Penalty → charges → interest → principal, configurable | Applied + overpayment = payment; overpayment never touches principal |
| `arrears.ts` | Days past due and ageing buckets | Bucket totals equal the overdue total |

## Rules that are not negotiable

1. **No floats in money.** `Money` is a `bigint` of minor units. The single float in the
   codebase is the annuity factor inside `schedule.ts`, rounded once; every row after that
   is derived exactly and the last row absorbs the difference.
2. **Allocation order comes from the product.** `DEFAULT_ALLOCATION_ORDER` is the observed
   default, not a constant the engine assumes.
3. **Overpayment is a liability.** It posts to `2004`, never to principal.
4. **Arrears stop at buckets.** Mapping a bucket to a provisioning rate or a regulator's
   classification is policy data (O-002), not a domain constant.

## Deliberately absent

No posting rules, no chart of accounts, no interest accrual, no provisioning. Those depend on
`D-015` policy rows and arrive with the ledger package, where they are data rather than code.
