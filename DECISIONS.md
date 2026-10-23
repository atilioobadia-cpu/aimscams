# Decision Register

Architecture and domain decisions for the build. Status values: **Accepted** (build to this),
**Open** (must be resolved before the dependent work starts), **Rejected** (recorded so nobody
re-proposes it).

Dates are ISO. `Evidence` points into `docs/`.

---

## Accepted

### D-001 — Modular monolith plus one worker
**Status:** Accepted · `docs/04-architecture.md §2.1`

One deployable API with strict in-process module boundaries, plus a worker for posting, accrual,
imports, exports and notifications. Microservices only after a module demonstrably needs it
(candidates: reporting, messaging, billing).

**Why:** a disbursement touches credit, savings, charges, ledger and messaging atomically.
Distributed transactions would be worse than the coupling they solve.

### D-002 — Single PostgreSQL cluster, tenant-scoped rows with RLS
**Status:** Accepted · `docs/04-architecture.md §2.2`

`tenant_id` on every business table, enforced by row-level security *and* application scoping.
Not schema-per-tenant, not database-per-tenant.

### D-003 — Outbox-driven asynchronous posting
**Status:** Accepted · `docs/03-flows.md §8`, `docs/04-architecture.md §6`

Operational insert and outbox insert commit together. A worker builds and posts the balanced
entry. Failures land in a visible queue with `Resubmit`; resubmission reuses the same
idempotency key.

**Evidence:** the observed product ships a banner for transactions "submitted but not posted to
accounting", with a `Resubmit` button.

### D-004 — Append-only ledger
**Status:** Accepted · `docs/04-architecture.md §2.4`, `docs/05-data-model.md §4`

No updates to posted entries or lines. Corrections are a reversing entry plus a new entry. The
original is marked `Reversed`.

### D-005 — Products and policies are data
**Status:** Accepted · `docs/02-modules.md §12.4`, `docs/05-data-model.md §2`

Loan/savings products, charges, provisioning rules, approval stages and GL mappings are rows,
not code branches. Loans stamp the immutable `policy_version_id` they were priced under.

### D-006 — Regulatory templates keyed by (dialect, code, version)
**Status:** Accepted · `docs/06-regulatory-reporting.md`

`MSP05`, `MSP09` and `MSP10` denote different returns in the TCDC (SACCOS) and BoT (MFI) sets.
One `MSP05` screen parameterised by tenant would be wrong.

### D-007 — One report engine, definitions not screens
**Status:** Accepted · `docs/04-architecture.md §9`

53 operational reports and 15 financial reports share a definition registry, parameter schema
and renderer. Reject bespoke report components.

### D-008 — Reservations for guarantor blocking
**Status:** Accepted · `docs/03-flows.md §6`

A guarantee reserves a real balance on the guarantor's savings account. Release is idempotent on
the reservation id, not on loan status.

### D-009 — Multi-role users, `Entity : Action` permissions
**Status:** Accepted · `docs/01-system-overview.md §3`

Users hold the union of their roles' permissions. Permission strings are data seeded from the
observed catalogue (`Loan Account : Approve`, `Transaction : Reversal Approval`,
`Settings Policy : Approve`).

### D-010 — Import is a first-class module, not a script
**Status:** Accepted · `docs/07-build-plan.md §4`

Three-step wizard (upload → map → validate), batch audit, re-runnable, posts accounting for
financial rows. Tenants arrive with spreadsheets; the migration path is the product.

### D-011 — TypeScript monorepo, Angular + NestJS + PostgreSQL
**Status:** Accepted · `docs/04-architecture.md §17`

Angular 18 + PrimeNG (closest to the observed surface, largest local hiring pool), NestJS,
PostgreSQL 16, Redis, RabbitMQ, S3-compatible storage. `.NET 8` is an acceptable substitute for
the API tier if the team is Microsoft-centric; the architecture does not change.

### D-012 — Raw OCR corpus is not committed
**Status:** Accepted · `README.md#evidence-and-privacy`

It contains real member names and phone numbers. Local regeneration only. `ocr/` and `merged/`
are gitignored.

### D-013 — The product is AIMSCAMS; the observed product is evidence only
**Status:** Accepted · `LICENSE`, `NOTICE`

The system being built is **AIMSCAMS** (*Alpha Integrated Management System — CAMS*), owned by
Alpha Integrated Management System (AIMS) and authored by Atilio Obadia. Wakandi CAMS Admin is
*the observed product*: it is cited as the source of behavioural evidence and is never the name
of what we ship.

Consequences:
- Product identity (UI, docs titles, package names, environment names) is AIMSCAMS.
- Observed artefacts keep their original labels — route slugs, the tenant's own GL account
  names (`1001 Wakandi`), the captured footer — because they are evidence. Renaming them would
  falsify the record.
- The platform billing context (WBA) is AIMS-branded in a new deployment; the observed account
  names are seed-data differences, not architecture.
- Copyright and licence text live in `LICENSE` and `NOTICE`, not in individual documents.

---

## Open

### O-001 — Accounting policy: repayment entry direction
**Status:** OPEN · blocks the posting rule table · `docs/03-flows.md §7`, `docs/04-architecture.md §6.2`

**Problem.** The observed ledger shows a loan repayment as
`Dr 1205 Staff Loan + Dr 4005 Interest Income, Cr 1005 Bank NMB`. Debiting an income account on
a repayment is not standard double-entry treatment of interest income.

**Needed.** A written posting policy covering all 14 event templates (Dr/Cr, allocation order,
accrual reversal, write-off, provision) signed off by the tenant's accountant before the posting
engine encodes it. Do not copy the screenshot.

**Owner:** domain adviser + accountant. **Deadline:** before Phase 1 closes.

### O-002 — Statutory provision rate grids
**Status:** OPEN · blocks MSP03 and provisioning · `docs/06-regulatory-reporting.md §8.3`

SACCOS, MFI Type1 and MFI Type2 use different days-past-due buckets and rates. Obtain the
current statutory grids rather than inferring them from sample data.

### O-003 — Submission channel
**Status:** OPEN · blocks the returns lifecycle UI · `docs/06-regulatory-reporting.md §8.4`

Assumed: export PDF/Excel + manual upload to the regulator portal, with an acknowledgement
attachment. Confirm whether any regulator offers an API.

### O-004 — MSP10 (SACCOS) complaint report data source
**Status:** OPEN · `docs/06-regulatory-reporting.md §8.1`

No complaints register exists in the observed product. Either the return is filled manually or a
register must be specified.

### O-005 — MSP11 counterparty register
**Status:** OPEN · `docs/06-regulatory-reporting.md §8.2`

Requires a bank/financial-institution register that is not visible in the observed settings.

### O-006 — Campaigns and Services scope
**Status:** OPEN · `docs/02-modules.md §8, §12.8`

Both appear in navigation; Campaigns has no captured screens and Services captures empty. Scope
them before promising either.

### O-007 — Council type on branches
**Status:** OPEN · `docs/06-regulatory-reporting.md §8.5`

MSP07/MSP10 need CC / MC / DC / TC per branch. Not present in the observed branch form; add the
field.

### O-008 — Confirm the tenant migration source format
**Status:** OPEN · `docs/02-modules.md §10`

Import templates were recovered (`Member Template`, `Account_Standard_Template.xlsx`,
`Transaction_Template.xlsx`), but the first real tenant's export format is unknown. Import a
real file in month 2.

---

## Rejected

| Option | Why rejected |
|---|---|
| Event-sourcing the whole domain | Operational cost with little gain; append-only ledger already provides auditability |
| Microservices from the start | Transactional coupling; team size; reporting needs joins |
| Document database as system of record | Financial reporting and reconciliation are relational |
| Schema-per-tenant or database-per-tenant | Migration and cost burden at this tenant size |
| Business logic in stored procedures | Untestable, unversioned, hard to review |
| A generic BPMN engine for approvals | Four fixed stages plus a request queue; BPMN is overkill |
| Deriving balances only from operational rows | Guarantees silent ledger drift |
| Committing the OCR corpus | Personal data of real members; see D-012 |
