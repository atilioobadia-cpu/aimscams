# Microfinance CAMS

Specification-first repository for a **SACCO / microfinance back office for Tanzania**:
members and KYC, savings and shares, credit, teller operations, double-entry accounting,
and the statutory returns required by TCDC and the Bank of Tanzania.

There is **no application code yet**. This repo holds the reverse-engineered specification
that the build will follow. Read it before writing a line of production code.

> Independent interoperability analysis. Not affiliated with, endorsed by, or containing the
> source code of any vendor product. See [Evidence and privacy](#evidence-and-privacy).

---

## Start here

| If you are… | Read |
|---|---|
| New to the project | [`docs/01-system-overview.md`](docs/01-system-overview.md) |
| Picking up a screen or writing stories | [`docs/02-modules.md`](docs/02-modules.md) |
| Designing behaviour or an API | [`docs/03-flows.md`](docs/03-flows.md) |
| Setting up the codebase | [`docs/04-architecture.md`](docs/04-architecture.md) |
| Writing a migration | [`docs/05-data-model.md`](docs/05-data-model.md) |
| Building a return (MSP01–MSP11) | [`docs/06-regulatory-reporting.md`](docs/06-regulatory-reporting.md) |
| Planning a sprint | [`docs/07-build-plan.md`](docs/07-build-plan.md) |
| Arguing about a decision | [`DECISIONS.md`](DECISIONS.md) |

Full index: [`docs/README.md`](docs/README.md).

---

## Status

| Area | Status |
|---|---|
| Domain specification | Complete (145 screens, 53 reports, 17 statutory returns) |
| Architecture and data model | Complete, decisions recorded |
| Delivery plan | Complete; MVP cut defined |
| Application code | **Not started** |
| Accounting policy sign-off | **Open** — see [DECISIONS.md](DECISIONS.md#open) |
| Regulatory form versions | **To verify** against current TCDC / BoT forms |

Target MVP: members, savings, loans, trial balance, financial position, income statement,
MSP01 and MSP02.

---

## Repository layout

```
docs/                 the specification (8 documents)
  README.md           index, provenance, known gaps
  01..07              overview, modules, flows, architecture, data model, regulatory, build plan
DECISIONS.md          decision register — what is settled and what is not
evidence/             non-sensitive artefacts (route index, source inventory)
tools/
  mermaid-check/      parses every diagram in docs/ with the real mermaid parser
  corpus/             scripts that regenerate the OCR corpus locally (output is gitignored)
```

CI: `tools/mermaid-check/ci-workflow.yml` is ready to enable — see
[its README](tools/mermaid-check/README.md#ci).

---

## The rules we build by

These come out of the spec and are not open for reinterpretation during implementation.

1. **The ledger is append-only.** Corrections are reversing entries, never edits or deletes.
2. **Every money movement has an idempotency key.** Retries are no-ops, not duplicates.
3. **Operational write and ledger write are separate.** Outbox → worker → posted entry, with a
   visible queue for failures and a `Resubmit` action.
4. **Products are configuration.** Interest method, accrual, charges, provisioning, GL mapping
   and approval stages live in data, not in branches.
5. **Closed periods are hard walls.** Post into the open period, always.
6. **Returns are versioned artefacts.** Freeze on submit; never mutate a filed return.
7. **Segregation of duties is a domain rule.** No self-approval, no two consecutive loan stages.
8. **Every row is tenant-scoped**, enforced by row-level security as well as application code.
9. **Two regulators, two dialects.** `MSP05`, `MSP09` and `MSP10` mean different returns under
   TCDC (SACCOS) and BoT (MFI). Template keys are `(dialect, code, version)`.
10. **Money is never a float.** Integer minor units in transport, `NUMERIC(18,2)` at rest.

---

## Contributing

- Branch from `main`: `feat/<scope>`, `fix/<scope>`, `docs/<scope>`.
- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Documentation changes must keep `tools/mermaid-check` green — enable the workflow in
  `tools/mermaid-check/ci-workflow.yml` so it runs on every PR.
- If you change a documented rule or field, update the doc **in the same PR**. The spec is the
  contract; drift between docs and code is a defect.
- Never commit real member data. See below.

### Checks

```bash
cd tools/mermaid-check
npm install
npm run check
```

---

## Evidence and privacy

The specification was reconstructed by OCR-ing 426 production screenshots of a live tenant.
Field labels, ledger codes and enum values in `docs/` are evidence-based; inferences are marked
as such.

**The raw OCR corpus is deliberately not in this repository.** It contains real member names,
phone numbers and national ID fragments visible in the screenshots. Publishing it would breach
the Tanzanian Personal Data Protection Act 2022.

Regenerate it locally if you need to check a claim:

```powershell
# Requires Windows PowerShell 5.1 (uses Windows.Media.Ocr; no cloud service, no API key)
tools\corpus\ocr-all.ps1 -Source F:\Wakandi -Out .\ocr
python tools\corpus\merge.py
```

`ocr/` and `merged/` are gitignored. Do not add them.

### Licensing

- No vendor source code, assets or logos are included.
- The reconstruction is for building a comparable system; verify every regulatory line item
  against the current TCDC and BoT forms before commercial reliance.
- The accounting entries in the spec are **observations**, not accounting advice. See
  [DECISIONS.md](DECISIONS.md).
