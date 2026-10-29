# AIMSCAMS — agent context

Back office for Tanzanian SACCOs, microfinance institutions and commercial lenders. One
codebase, one installation and one database **per institution**. Reconstructed from a
426-screenshot corpus of Wakandi CAMS Admin; that product is evidence only, never our identity.

## Read before acting

| Read | When |
|---|---|
| [`docs/09-system-blueprint.md`](docs/09-system-blueprint.md) | Deciding **what** the product does: 147 pages, 13 flows, role model, System Logs |
| [`docs/10-technology-stack.md`](docs/10-technology-stack.md) | Deciding **how** it is built: stack, deployment, modules, DB invariants, payments, security gates, roadmap |
| [`docs/11-ui-contract.md`](docs/11-ui-contract.md) | Touching **any** UI, styling, layout, or verifying a rendered screen |
| [`docs/12-deployment.md`](docs/12-deployment.md) | Deploying, releasing, backing up, or provisioning an institution |
| [`docs/13-build-sequence.md`](docs/13-build-sequence.md) | Building a page: order, verification gate, commit policy |
| [`DECISIONS.md`](DECISIONS.md) | A decision looks wrong, or you are about to contradict one. D-018…D-026 are current |
| [`docs/05-data-model.md`](docs/05-data-model.md) · [`docs/06-regulatory-reporting.md`](docs/06-regulatory-reporting.md) | Writing migrations, or building returns MSP01–MSP11 |

`docs/README.md` indexes the full set. Read order for a new session: 09 → 10 → 11 → DECISIONS.

## Hard rules

1. **Money is integer minor units** (TZS×100, `bigint`/`Prisma.BigInt`). Never `Float`, never a
   JS `number` for an amount. Serialise as a string across JSON.
2. **The ledger is append-only.** Posted entries and lines are never updated or deleted;
   corrections are reversing entries. Balance, immutability, the period guard and RLS are
   enforced by SQL in `packages/ledger/src/schema.sql`, not by service code.
3. **The API is the only writer.** Next.js may read; NestJS mutates. Business rules live once.
4. **The outbox commits with the business row.** Nothing goes to BullMQ before commit. Consumers
   are idempotent; a non-empty dead-letter queue is a P1.
5. **Isolation:** each institution gets its own installation and database. Keep
   `organisation_id`/`branch_id` on business rows and RLS enabled as defence in depth.
   **One database per institution, never one per module** — a disbursement must write loans,
   savings, charges, the ledger and the outbox in one transaction.
6. **No real people.** No member, staff or tenant data from the observed product. Demo data is
   synthetic; `ocr/` and `merged/` stay gitignored.
7. **AIMSCAMS branding, never Wakandi** in shipped UI, docs titles, package names or env names.
   Observed artefacts keep their labels only where they are quoted as evidence.
8. **A UI change is not done until measured** in a real browser against `docs/11 §8` — every
   affected page, the collapsed sidebar, and every dropdown. Report measured values, not
   impressions. "Looks right" is not evidence.
9. **Statistics must reconcile.** Page counts and report counts in the blueprint are asserted;
   if you change one, re-derive the totals.
10. **Production is Linux with OCI containers.** Docker Engine is the default runtime, Podman is
    compatible, native systemd is a fallback. WSL2 may host development databases, but it is never
    a deployed target. Generate Prisma Client and compile native modules inside the Linux image.

## Current state

- `packages/domain` — money, schedule generation, allocation, arrears. Builds to `dist`; tested.
- `packages/ledger` — `schema.sql` invariants, posting engine, journal entries, ledger page, trial
  balance and the outbox writer. Tested against real PostgreSQL via PGlite.
- `docs/01`–`docs/13` — specification complete through stack, UI contract, deployment and build sequence.
- `apps/web/aimscams-web` - **deleted** (Phase 14). All routes served by Next.js.
- `apps/web` (Next.js) - full back office: dashboard, clients, accounts, transactions (teller,
  history, approval, all, online, reconciliation), requests, accounting (chart, entries, ledger,
  assets, fixed assets, reports), reports hubs, import, messages, settings, system logs.
- `apps/api` (NestJS) - auth, users/roles, accounting, settings, transactions, messages, ledger
  reads, outbox status, organisation and branch writes.
- `apps/worker` (BullMQ) — claims the transactional outbox, publishes with idempotency keys,
  leases expired claims and dead-letters exhausted events.
- `packages/db` (Prisma 7 + PostgreSQL 16), `packages/contracts` (Zod) — schema and migration stream.
- `deploy/` and `.github/workflows/ci.yml` — one Linux image with web/api/worker commands.

## Commands

```powershell
npm test                 # all workspaces
npm run typecheck        # all workspaces
cd tools/mermaid-check; npm run check   # validate Mermaid in docs
```

## Settled decisions

`D-024` rules O-009…O-012: application auth (not Keycloak), AIMSCAMS branding from day one, the
measured 12-item sidebar, and a frozen Angular app deleted after Next.js reaches parity. `O-013`
is the only open item: installations default to vendor-hosted in-country, with on-premise as a
variant. Do not re-litigate a resolved decision without new evidence; record a new decision if the
evidence changes.
