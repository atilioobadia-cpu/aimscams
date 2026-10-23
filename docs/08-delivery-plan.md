# 08 — Delivery Plan

How AIMSCAMS gets built: the phases, the gates between them, the team, and the working
practices that keep the ledger honest. This is the *execution* plan. `07-build-plan.md` is the
*scope* plan (what is in the MVP, 48 epics, the Gantt). Read both.

**Total effort:** ~47 weeks (≈11 months) to a production pilot, with the team below.
Phases 2 and 3 can overlap after G1; the front end runs in parallel from Phase 1.

---

## 1. The quality bar

A slice is done when all of these are true. Any "no" means it is not done, regardless of
whether it renders.

| # | Requirement |
|---|---|
| 1 | A test fails before the change and passes after. Domain rules are tested without a database. |
| 2 | Every money movement posts through the outbox and produces a balanced entry; the test asserts the entry, not just the balance. |
| 3 | The permission is enforced on the server. Hiding a button is not enforcement. |
| 4 | The audit trail records actor, before, after, and the request id. |
| 5 | Migrations are tested against production-shaped data, not against an empty schema. |
| 6 | No member PII in logs, metrics, traces, error trackers or URLs. |
| 7 | `docs/` is updated in the same PR that changes behaviour. Spec drift is a defect. |
| 8 | The feature can be switched off. Anything touching the ledger ships behind a flag. |
| 9 | `npm test`, typecheck and `tools/mermaid-check` are green. |
| 10 | Someone other than the author has reviewed it for both standards and spec. |

---

## 2. Team shape

| Role | Count | Notes |
|---|---|---|
| Delivery lead / architect | 1 | Owns boundaries, reviews every migration and posting rule |
| Backend engineers | 2–3 | TypeScript/NestJS; one with strong SQL |
| Frontend engineers | 2 | Angular 18 + PrimeNG; one owns the design system |
| QA / automation | 1 | E2E, regression, release sign-off |
| Business analyst | 1 | Turns screens into stories; owns tenant onboarding and UAT |
| Accountant adviser | 0.2 | Signs off O-001, O-002 and every return layout |
| DevOps / security | 0.3 | Environments, CI, backups, threat model |

Minimum viable team is 5: lead, 2 backend, 1 frontend, 1 QA, with the accountant on retainer.
Below that, the schedule does not hold — the ledger and credit phases are where the work is.

### The accountant adviser — what to hire

Do not use a general bookkeeper, and do not let the engineering team self-certify the accounting
policy. Hire for three fixed deliverables, not for hours:

| Deliverable | Resolves | Acceptance |
|---|---|---|
| Posting policy memo: all 14 event templates — Dr/Cr, allocation order, accrual and reversal, write-off, provisioning | O-001 | Signed by a CPA(T); the engineer implements it without interpretation |
| Provision grid mapping: SACCOS/TCDC and MFI Type 1/Type 2 buckets and rates, each cell traceable to a circular or guideline | O-002 | One table per dialect |
| Return layout verification: MSP01–MSP11 line items against the current TCDC and BoT forms | O-003, O-004, O-005 | Line-by-line sign-off; discrepancies listed |

Profile: **CPA(T) registered with the NBAA**, five or more years in a deposit-taking SACCO, MFI
or bank finance function, and direct experience preparing or auditing TCDC returns. Independence
matters — not the developer, not a shareholder of AIMS.

How to source it: approach two or three NBAA-registered firms with a financial-institutions
practice and ask specifically for the partner or manager who signs SACCO or MFI work. A
cost-effective shape is a firm for the formal sign-off plus a retired SACCO accountant or former
TCDC examiner as the day-to-day sounding board. Fixed fee per deliverable; the scope above is
small enough to price.

Because AIMSCAMS is greenfield (D-014), there is no historical restatement to negotiate — the
adviser defines policy forward, which is the cheapest moment to involve them.

---

## 3. Phases and gates

A gate is a **stop**. Do not start the next phase on optimism; start it on evidence.

### Phase 0 — Decisions and foundation · 3 weeks

Resolve what blocks the build, stand up the skeleton, agree the bar.

- O-001 accounting policy signed by the accountant (blocks posting rules)
- O-002 provision grids obtained from TCDC and BoT (blocks MSP03 and provisioning)
- O-007 council type added to the branch model
- Stack confirmed (Angular + NestJS + PostgreSQL, or .NET 8 for the API tier)
- Monorepo, environments (dev/staging/prod), CI, secrets, backups, threat model
- Domain kernel scaffolded with tests: money, schedules, allocation, arrears, journal mechanics

**Gate G0:** O-001 and O-002 signed; CI runs tests + typecheck + diagrams on every PR; a threat
model exists and the top five risks have owners; the domain kernel tests are green.

### Phase 1 — Ledger and accounting core · 7 weeks

The part everything else depends on. Nothing else starts until it is trustworthy.

- Tenancy, branches, fiscal periods, chart of accounts, GL groups
- Journal entry/line, period guard, balance constraint, append-only enforcement
- Outbox → worker → posting engine, with the failure queue and `Resubmit`
- Trial balance, financial position, income statement, general ledger, journal report
- Row-level security, tenant isolation tests, audit trail

**Gate G1:** the trial balance ties to the GL to the cent after a scripted week of mixed
transactions; an unbalanced entry is impossible at the database level; a posted entry cannot be
edited or deleted by any code path; period close blocks back-dated posting.

### Phase 2 — Membership and savings · 6 weeks

- Member 360, KYC documents, next of kin, income, assets, bank/MNO details
- Groups and group membership
- Savings products, accounts, deposits, withdrawals, holds
- Share capital, reserves, interest payout
- Member statements

**Gate G2:** a member can be onboarded, KYC-verified, opened, funded, withdrawn from, and
statemented end to end, with every step posting to the ledger and respecting permissions.

### Phase 3 — Credit · 9 weeks

The largest phase. Do not compress it.

- Origination, eligibility, scoring inputs, documents
- Four-stage approval with segregation of duties
- Disbursement, schedules (equal instalment, equal principal, flat), rescheduling
- Accrual, arrears ageing, NPA classification, provisioning
- Guarantors with balance reservations; collateral register
- Write-off and recovery

**Gate G3:** a loan runs origination → approval → disbursement → repayment → arrears →
provision end to end; no user occupies two consecutive approval stages; guarantor release is
idempotent; the schedule repays principal exactly for every product configuration tested.

### Phase 4 — Branch and teller operations · 5 weeks

- Teller sessions, open/close, till counts, cash movements
- 11 client transaction types, 8 GL types, 3 till types, 2 bulk types
- Reversals with approval and reversing entries
- Day-end reconciliation

**Gate G4:** a full day of teller activity reconciles to zero variance at close; a reversal
produces a reversing entry and never mutates the original.

### Phase 5 — Reporting and regulatory · 7 weeks

- Report engine: definitions, parameters, grid/CSV/XLSX/PDF
- 53 operational reports, 15 financial reports
- MSP01–MSP11 for both dialects, versioned templates, validation, freeze-on-submit
- Submission pack with acknowledgement attachment

**Gate G5:** the accountant reconciles an independently prepared return to the system's output
for one full month; a filed return cannot be mutated; the SACCOS and MFI dialects produce
different, correct results for MSP05, MSP09 and MSP10.

### Phase 6 — Import and messaging · 4 weeks

AIMSCAMS starts greenfield: there is **no migration from the observed tenant**. Import exists
because future tenants will arrive with spreadsheets.

- Three-step import wizard (upload → map → validate), batch audit, re-runnable
- Member / account / transaction templates
- SMS, email and push templates, segments, dispatch log
- A synthetic 1 000-member dataset and a statement file, generated to the reference shape

**Gate G6:** the synthetic dataset imports twice into a clean environment with identical
results and no duplicate members or accounts; per-row errors are reported and fixable without
re-uploading the whole file.

### Phase 7 — Hardening, pilot, go-live · 6 weeks

- Performance work against production-shaped data
- External security review and remediation
- Backup/restore drill, disaster recovery runbook
- UAT with the first tenant, training, go-live and rollback plan

**Gate G7:** UAT signed by the first tenant; restore drill completed inside the agreed RTO; security
findings closed or accepted in writing; rollback rehearsed.

---

## 4. Skill playbook

What fires, when, and what it must produce. These are working practices, not ceremony — each
one exists because skipping it has a known failure mode.

| Skill | Fires | Produces |
|---|---|---|
| `spec-driven-development` | Phase 0 | The specification (done) and the capability map per phase |
| `architect` | Every epic that crosses a module boundary | A short design note: callers, data structures, signatures, failure modes — before code |
| `planning-and-task-breakdown` | Start of each phase | Ordered tasks with estimates and dependencies |
| `test-driven-development` / `tdd` | Every domain rule, every bug fix | A failing test first; the rule is expressed as an assertion, not a comment |
| `incremental-implementation` | Every feature | Thin vertical slices, merged behind flags, never a big-bang branch |
| `security-and-hardening` | Phase 0 threat model; every auth, input and file-upload surface | Controls mapped to OWASP; dependency audit before each release |
| `accessibility` | Every screen | WCAG 2.2 AA verified in the browser, not asserted |
| `webapp-testing` / `playwright` | Every UI epic | E2E specs that drive the real app and check the console |
| `code-review-and-quality` / `code-review` | Every PR | Two-axis review: standards and spec conformance |
| `documentation-and-adrs` | Every decision | An entry in `DECISIONS.md` and the doc updated in the same PR |
| `observability-and-instrumentation` | From Phase 1 | Metrics, traces and structured logs per business flow; the posting queue has a dashboard |
| `performance` / `core-web-vitals` | Phase 5 and 7 | Budgets met on the heaviest screens (member list, loan book, reports) |
| `blast-radius` | Before merging wide changes (schema, permissions, posting) | Written impact report: callers, contracts, what is cleared and what is still risky |
| `github-delivery` / `git-workflow-and-versioning` | Daily | Branches, PRs, review, merge policy, release tags |
| `repo-audit` | End of each phase | Quality report; drift between docs and code |
| `skill-creator` | When a domain workflow repeats | A project-specific skill, e.g. ledger-entry review, return validation |

Deliberately **not** used: any generator that scaffolds an app before the decisions in Phase 0
are signed. Boilerplate that encodes the wrong accounting model is worse than no boilerplate.

---

## 5. Risks and what they cost

| Risk | Impact | Mitigation |
|---|---|---|
| O-001 unresolved when credit starts | Posting rules rewritten, historical entries restated | Hard gate at G0; do not encode observed entries |
| O-002 grids wrong per regulator | Returns rejected; provisions misstated | Obtain the current forms; accountant signs the bucket table |
| Scope creep from 145 screens | Phase 3 slips; MVP never ships | MVP cut in 07; everything else is Phase 5+ |
| Bulk import quality | A tenant's opening balances do not reconcile | Two clean runs at G6; reconciliation report signed by the tenant |
| Regulator changes forms mid-build | Rework in Phase 5 | Templates versioned from day one; no hard-coded layouts |
| Key-person dependency | Delivery stalls | Architecture decisions written down; pairing on ledger and credit |
| Tenant isolation defect | Cross-tenant data exposure | RLS + application scoping + automated isolation tests in CI |

---

## 6. Cadence

- **Weekly:** demo of working software to the BA and accountant; nothing demoed that is not
  merged.
- **Per decision:** an ADR entry. If it is not in `DECISIONS.md`, it is not decided.
- **Per PR:** tests, typecheck, diagrams, review. Schema and posting changes also need the
  architect.
- **Per phase:** a repo audit, a retrospective, and an explicit gate review with written
  exit criteria — not a verbal "looks good".

---

## 7. First ten working days

1. Confirm stack and repo layout; stand up CI that actually runs.
2. Book the accountant for O-001 and O-002; send them `03-flows.md §7` and `06 §8.3` in advance.
3. Threat model the tenancy and ledger boundaries.
4. Scaffold the domain kernel (money, schedule, allocation, arrears) with tests — no framework,
   no database.
5. Write the tenancy and ledger migrations with their constraints, and a test that proves each
   constraint fires.
6. Agree the branch/PR/merge policy and the definition of done with the team.
7. Draft the validation plan with the first tenant: which month, which reports, who signs.

If items 1–5 are not done in ten days, the delay is in decisions, not in engineering.
