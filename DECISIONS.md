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
**Status:** Superseded by D-019 for deployment topology · `docs/04-architecture.md §2.2`

`tenant_id` on every business table, enforced by row-level security *and* application scoping.
Not schema-per-tenant, not database-per-tenant.

**Superseded 2026-10-26.** D-019 deploys one database per institution. The tenant-scoped columns
and RLS remain as defence in depth; only the "one shared cluster for every tenant" choice is
reversed.

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
financial rows. Future tenants arrive with spreadsheets; the import path is the product.
AIMSCAMS itself starts greenfield — see D-014.

### D-011 — TypeScript monorepo, Angular + NestJS + PostgreSQL
**Status:** Superseded by D-018 · `docs/04-architecture.md §17`

Angular 18 + PrimeNG (closest to the observed surface, largest local hiring pool), NestJS,
PostgreSQL 16, Redis, RabbitMQ, S3-compatible storage. `.NET 8` is an acceptable substitute for
the API tier if the team is Microsoft-centric; the architecture does not change.

**Superseded 2026-10-26.** D-018 replaces Angular with Next.js + Tailwind/shadcn and RabbitMQ
with Redis + BullMQ. NestJS, PostgreSQL, Redis and S3-compatible storage carry forward.

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

### D-014 — Greenfield data: nothing is migrated from the observed tenant
**Status:** Accepted · `docs/08-delivery-plan.md` Phase 6

AIMSCAMS starts with an empty database. No members, accounts, balances, transactions, documents
or staff records from MFSL — or from any other observed tenant — are copied, imported, mirrored
or used as seed data.

**Why.** The observation transferred *structure*: fields, codes, flows and rules. It did not
transfer a business. The two systems have different charts of accounts, different products and
different opening positions; carrying balances across would import a history the new ledger
never generated, and the ledger would be unauditable from its first day. It would also move
personal data into a new controller's environment without a lawful basis.

**Consequences.**
- The first tenant gets an empty chart of accounts seeded from the AIMSCAMS template, not the
  observed tenant's names (`1001 Wakandi`, `5501 Wakandi Fees`).
- Validation uses a synthetic dataset generated to the same shape — 1 000 members, a statement
  file — never production rows.
- Import remains a first-class module (D-010), because future tenants will arrive with
  spreadsheets of their own.
- The screenshots are the only remaining link to the observed tenant, and they stay out of the
  repository (D-012).

### D-015 — Kickoff rulings: the screenshots are the rulebook, gaps are marked assumptions
**Status:** Accepted 2026-10-23 · supersedes O-001…O-007

The build starts now. No external sign-off gates it. The observed system, as captured in the 426
screenshots, is the baseline for posting rules, allocation order, accrual and provisioning.

| Item | Ruling |
|---|---|
| O-001 repayment direction | Implement as observed (`Dr 1205 + Dr 4005 / Cr 1005`), marked `assumption`, stored as a policy row, correctable without code — **superseded by D-017** |
| O-002 provision grids | Seed typical SACCOS and MFI Type 1/Type 2 buckets and rates, flagged `assumption`; MSP03 reads the table |
| O-003 submission channel | PDF/Excel export plus manual portal upload; acknowledgement attached to the submission |
| O-004 MSP10 source | Build a complaints register; MSP10 reads it |
| O-005 MSP11 counterparty | Manual register in Settings |
| O-006 Campaigns / Services | Out of MVP; remove the navigation entries rather than ship dead links |
| O-007 council type | `council_type` (CC/MC/DC/TC) on branch, in the first migration |
| O-008 legacy import format | Still open, low priority, blocks nothing |

**Why this is safe.** Rules are data (D-005), keyed by `(dialect, event, version)`. An assumption
is a row, not a hard-coded branch; correcting one is a new policy version, and already-posted
entries are never rewritten (D-004). Every assumption lives in one table
(`docs/06-regulatory-reporting.md §8.3`) so an adviser reviews a page, not a codebase.

**Revisit when** an accountant or regulator gives written direction. That becomes a new policy
version; the old one stays for historical entries.

### D-016 — Ledger rules live in the schema; tests run real PostgreSQL through PGlite
**Status:** Accepted 2026-10-23 · `packages/ledger`

The ledger's invariants are enforced by the database, not by application code: deferred
constraint triggers refuse an unbalanced entry at commit, triggers make posted entries and their
lines immutable, a period guard refuses writes outside an open period, composite foreign keys
make cross-tenant lines impossible, and forced row-level security isolates tenants.

Amounts are `bigint` minor units end to end — the same representation as `packages/domain` — so
no shilling is lost between the domain and the book and no ledger amount is ever a float.

**Why PGlite.** The development machine has no Docker, and mocking a database would test nothing.
PGlite is PostgreSQL compiled to WASM, so the suite applies the exact `schema.sql` and exercises
the real triggers and RLS. The schema is plain, standard SQL; staging and production use a normal
PostgreSQL 16 server with the same file.

**Consequences.** The test suite is slower (about 20 seconds for the ledger package) because each
case starts a database. That is the price of testing the constraints instead of trusting them.

### D-017 — A loan repayment posts the standard direction, not the observed row
**Status:** Accepted 2026-10-23 · supersedes the O-001 row in D-015 · `packages/ledger/src/seed.ts`

The observed ledger shows a repayment as
`Dr 1205 Staff loan + Dr 4005 Interest income / Cr 1005 Bank`. AIMSCAMS posts
`Dr cash / Cr 1201 Loans receivable (principal) / Cr 4001 Interest income (interest) /
Cr 4101 Loan management fee / Cr 4104 Loan penalty`, with the policy row flagged
`is_assumption`.

**Why the ruling changed.** D-015 was written before the posting engine and the chart of accounts
existed. Two things became explicit once they did:

- Debiting an income account on a repayment *reduces* income rather than recognising it. The
  entry does not represent the transaction under double entry.
- `1205` is the staff-loan ledger. A member repayment does not belong there; the receivable is
  `1201`.

**Consequences.**

- The observed row stays in `docs/03-flows.md §7` and `docs/04-architecture.md §6.2` as
  evidence, annotated with this ruling.
- The policy row stays `is_assumption = true`: a CPA still has to confirm how a repayment splits
  between interest, fees and penalties.
- Correcting it later is a new policy version. Posted entries are never restated (D-004).
- No `4005` account is seeded until a policy needs it.

### D-018 — Stack: Next.js, NestJS, PostgreSQL, Prisma, Redis/BullMQ, S3
**Status:** Accepted 2026-10-26 · supersedes D-011 · owner decision · `docs/10-technology-stack.md`

| Layer | Choice |
|---|---|
| Frontend | Next.js + TypeScript |
| UI system | Tailwind CSS + shadcn/ui |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL |
| Data access | Prisma, with hand-written SQL migrations where needed |
| Authentication | Keycloak *or* application auth — `O-009` |
| Authorisation | RBAC plus resource-level scoping |
| Background work | Redis + BullMQ |
| Documents | Private S3-compatible storage |
| API documentation | Swagger / OpenAPI |
| Testing | Jest + Playwright |
| Deployment | Docker + Linux + Nginx |
| Monitoring | Prometheus + Grafana |

**Why.** One typed language end to end, a single relational system of record, and one API plus
one worker rather than microservices (D-001 still holds). The stack adds no architectural
capability that the blueprint lacked; it names the implementation.

**Consequences.**
- The Angular application is legacy from this point (`O-012`); the Next.js app is the frontend.
- Prisma is the access layer, not the owner of correctness. Triggers, deferred constraints,
  immutability, the period guard and RLS stay as SQL migrations (D-016, `docs/10 §7`).
- The API is the only writer; Next.js may read but must not mutate business data.
- Versions are pinned at kickoff and recorded in the lockfile, not in the decision text.

### D-019 — One installation and one database per institution
**Status:** Accepted 2026-10-26 · supersedes D-002 for deployment topology · `docs/10 §2`

One shared codebase, deployed separately for every institution. Each installation has its own
application instance, PostgreSQL database and credentials, users and roles, encryption keys,
object-storage scope, backups, and institution-specific financial configuration.

**Why.** Isolation by deployment stops a breach or a bad migration at one institution; it gives
each institution a boundary its auditor can inspect; it allows on-premise or in-country hosting
where required; and it permits per-institution configuration without feature flags accumulating
in one shared database.

**Consequences.**
- `organisation_id` and `branch_id` stay on every business row, and RLS stays enabled (D-002's
  mechanism, now defence in depth rather than the isolation boundary).
- There is no cross-institution report. Fleet-level metrics are collected out of band.
- Every release and migration runs N times. Productise it: versioned images, one Compose/Helm
  template, a migration runner, a schema-version health endpoint, a tested restore drill
  (`docs/10` R-2).
- Backups and restores are per institution and must be rehearsed, not assumed.

### D-020 — The measured reference is the visual contract; the identity is AIMSCAMS
**Status:** Accepted 2026-10-26 · supersedes the earlier styling targets · `docs/11-ui-contract.md`

Adopt the measured surface exactly: tokens, 97px header, 300px sidebar, 12-item navigation,
44px active pills, 12px card radius, KPI geometry, chart treatment, floating chat button.
Substitute AIMSCAMS identity per D-013: wordmark, footer, and synthetic demo institution,
branch and user.

**Why.** The measurements are evidence of a working product, not a mood board. Copying them
removes guesswork from every screen. Copying another company's *identity* is not permitted by
D-013, so the mark changes and the geometry does not.

**Consequences.**
- Brand colour for this UI is `#057573`; page background `#ebe9e9`. These supersede `#0F4D3A`
  and `#ECEBEC`.
- The footer reads "© 2026 AIMSCAMS. All rights reserved."
- Demo tenant, branch and user are synthetic; no observed tenant's staff or member data appears.
- A UI change is not done until the rendered result has been measured in a real browser against
  the checklist in `docs/11 §8`.

### D-021 — Money is integer minor units at rest
**Status:** Accepted 2026-10-26 · clarifies the "decimal monetary types" requirement · `docs/10 §7`

Amounts are `bigint` TZS×100 at rest, mapped to `Prisma.BigInt`; the API serialises them as
strings or integer minor units; the UI formats them for display. No `Float`, no expensive
`Decimal` conversion inside the ledger.

**Why.** This satisfies "precise, never floating point" more strictly than `numeric(18,2)` while
keeping one representation across `packages/domain`, `packages/ledger` and the database. Two
representations would create a conversion surface where rounding bugs live.

**Consequences.** A JSON transformer is required because `bigint` is not JSON-serialisable.
Decimal parsing happens only at the input and display boundaries.

### D-022 — The outbox is the source of truth; BullMQ is transport
**Status:** Accepted 2026-10-26 · extends D-003 · `docs/10 §7, §12 R-1`

The business row and its outbox row commit in one transaction. A relay publishes the outbox row
to BullMQ; a worker consumes it and posts with the same idempotency key. Nothing is enqueued
before commit.

**Why.** Redis can lose recent writes. If the queue were the record, a flush would lose a
posting. The outbox makes delivery at-least-once and replay harmless.

**Consequences.** Consumers must be idempotent. Retries use backoff, then a dead-letter queue
that is visible in the System Logs posting tab. A non-empty dead-letter queue is a P1 alert.

### D-023 — Tanzania-specific capabilities stay in scope
**Status:** Accepted 2026-10-26 · `docs/10 §5.3`

Retained even though the stack plan does not mention them: statutory returns MSP01–MSP11 in both
TCDC and BoT dialects, teller and vault cash control with denominations and variance, guarantor
fund reservations, immutable policy versioning stamped on each loan, the unposted-transactions
queue with `Resubmit`, maker-checker approvals, and the tamper-evident audit trail.

**Why.** These are the capabilities that make the product sellable to a Tanzanian SACCO or MFI,
and they constrain the ledger, chart of accounts and branch model. Retrofitting them after the
schema settles is the expensive path.

**Consequences.** The roadmap in `docs/10 §11` includes them before the pilot, not in a later
phase. Their data requirements are already in `docs/05` and `docs/06`.

### D-024 — Kickoff rulings: application auth, AIMSCAMS branding, measured sidebar, Angular retirement
**Status:** Accepted 2026-10-26 · resolves O-009…O-012 · sets the O-013 default

| ID | Question | Ruling |
|---|---|---|
| O-009 | Keycloak or application authentication | **Application auth**: argon2id, TOTP for privileged users and approvers, OIDC-shaped boundary so a Keycloak adapter is a swap rather than a rewrite |
| O-010 | Branding fidelity during the build | **AIMSCAMS from day one**; synthetic demo tenant, branch and user with the same text lengths so the measured layout still holds |
| O-011 | Sidebar information architecture | **The measured 12 items** for parity; the 8-group IA stays a proposal until the visual baseline is verified |
| O-012 | Angular retirement | **Freeze now, delete when Next.js passes `docs/11 §8`**; no new features and no styling fixes in the Angular app in the meantime |
| O-013 | Where installations run | **Default: vendor-hosted in-country**, on-premise supported as a per-institution variant. Contract confirmation still pending |

**Why application auth.** Keycloak is a stateful service with a realm, theme, database and upgrade
path *per installation*. With one installation per institution that multiplies the operational
surface by the customer count. Argon2id plus TOTP delivers the required MFA with one less
service. The identity boundary stays OIDC-shaped, so adopting Keycloak later changes the adapter,
not the domain.

**Why the 12-item sidebar.** It is the measured contract (D-020). Regrouping into 8 areas is a
product improvement that changes the geometry; it can be evaluated once there is a verified
baseline to compare against.

**Why freeze Angular now.** Two frontends means two design systems and two sets of defects. The
Angular shell stays runnable for demos but is not extended.

**Consequences.**
- No literal Wakandi wordmark, footer or tenant appears in committed UI (D-013).
- No infrastructure is provisioned until O-013 is confirmed, but design proceeds on the default.
- If SSO across AIMS products becomes a contractual requirement, that is a new decision, not a
  reinterpretation of this one.

### D-025 — Production runs Linux containers; WSL is development only
**Status:** Accepted 2026-10-26 · `docs/10 §2.2`

Production and staging run on a **Linux host** (Ubuntu LTS or Debian) with an **OCI container
runtime** — Docker Engine by default, Podman where a rootless daemon is required — plus Nginx
terminating TLS. The application ships as Linux container images. The host distribution is an
operational detail; the application depends only on the Linux container runtime.

**Docker is the default, not a dependency.** The artefact is an OCI image; any compatible runtime
may execute it. A native systemd deployment is a supported fallback for institutions that forbid
containers, provided it runs the same built output and does not fork the codebase.

**WSL2 is never a deployed target.** It is a developer convenience on Windows.

**Why.**
- WSL is a single-user desktop VM tied to a Windows session, with no service SLA and restarts
  driven by Windows updates.
- Its networking (NAT, localhost forwarding), clock and filesystem semantics differ from a real
  server, so failures found there do not predict production behaviour.
- Backups, firewalling, monitoring and unattended security updates are first-class on a Linux
  server and bolted on in WSL.
- Containers already isolate the application from the host, so targeting Linux costs nothing and
  removes a class of "works on my machine" defects.

**Consequences.**
- Local development may use WSL2 for PostgreSQL and Redis containers, but the deployment
  artefacts must be exercised against the same Linux images used in staging.
- Prisma Client and native modules are generated and compiled **inside** the Linux image. Copying
  `node_modules` from the Windows host into an image is prohibited.
- A native systemd deployment path is supported for institutions that refuse containers; it runs
  the same build output and is not a second codebase.
- Windows containers are not a supported target.
- This decides the runtime, not the hosting location; `O-013` still governs where the Linux hosts
  live.

---

## Open

> Resolved items are ruled on in **D-015**; the entries below are kept for their problem statements.

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

### O-008 — Confirm the import format for tenants arriving with legacy data
**Status:** OPEN · low priority · `docs/02-modules.md §10`

AIMSCAMS starts greenfield, so the first tenant has nothing to import. The import templates were
recovered (`Member Template`, `Account_Standard_Template.xlsx`, `Transaction_Template.xlsx`) and
are the default. Revisit when a tenant wants to bring a legacy system's export — the format will
be theirs, not the observed product's.

### O-009 — Keycloak or application authentication
**Status:** RESOLVED by D-024 (application auth) · blocks identity implementation · `docs/10 §12 R-6`

Both were named as acceptable. Keycloak gives OIDC, MFA and SSO out of the box, but it is a
stateful service with a realm, theme and upgrade path *per installation*. Application auth
(argon2id + TOTP, clean OIDC-shaped boundary) is less to operate across N installations and can
be swapped later.

**Needed:** a ruling. Default recommendation: application auth unless SSO across products is a
contractual requirement.

### O-010 — Branding fidelity during development
**Status:** RESOLVED by D-024 (AIMSCAMS from day one) · blocks UI text and screenshots · `docs/11 §7`

Adopt the reference measurements exactly (D-020). The open part is identity: ship AIMSCAMS
branding from the first screen, or keep the literal reference wordmark and tenant while
comparing pixel-for-pixel, then substitute before any demo.

**Needed:** a ruling. Default recommendation: AIMSCAMS from day one, with a synthetic demo tenant
that keeps the same text lengths so measurements still hold.

### O-011 — Sidebar information architecture
**Status:** RESOLVED by D-024 (measured 12 items) · blocks navigation build · `docs/09 §3`, `docs/11 §4`

The measured reference has 12 top-level items with chevrons. The blueprint proposes an 8-group
IA. D-020 adopts the 12-item sidebar because it is the measured contract; grouping is a product
improvement that changes the geometry.

**Needed:** confirm 12 items for parity, with regrouping deferred until after the visual
baseline is verified.

### O-012 — Retirement of the Angular application
**Status:** RESOLVED by D-024 (freeze now, delete after parity) · blocks frontend workstream · `docs/10 §4`

`apps/web/aimscams-web` exists and renders a shell. D-018 makes Next.js the frontend. Keeping
both means two design systems and two sets of bugs.

**Needed:** decide between delete-on-port (clean, history retains it) and keep-until-parity
(safer if the dashboard must be demoed during the transition). Default recommendation:
delete once the Next.js dashboard passes the `docs/11 §8` checklist, and never extend it
in the meantime.

### O-013 — Where installations run
**Status:** OPEN · default set by D-024 (vendor-hosted in-country) · blocks deployment, backup and support design · `docs/10 §2`

Institution on-premise, vendor-hosted, or both. This decides TLS termination, who owns backups,
how upgrades are scheduled, whether remote support is possible, and how data residency is
evidenced.

**Needed:** a ruling, or a per-institution policy with a supported default.

---

## Rejected

| Option | Why rejected |
|---|---|
| Event-sourcing the whole domain | Operational cost with little gain; append-only ledger already provides auditability |
| Microservices from the start | Transactional coupling; team size; reporting needs joins |
| Document database as system of record | Financial reporting and reconciliation are relational |
| Schema-per-tenant inside one shared cluster | Migration and configuration burden across schemas. Database-per-institution is now accepted in D-019; schema-per-tenant remains rejected |
| Business logic in stored procedures | Untestable, unversioned, hard to review |
| A generic BPMN engine for approvals | Four fixed stages plus a request queue; BPMN is overkill |
| Deriving balances only from operational rows | Guarantees silent ledger drift |
| Committing the OCR corpus | Personal data of real members; see D-012 |
