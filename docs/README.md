# Wakandi CAMS Admin — Reverse-Engineered Specification

A build-ready specification of the **Wakandi CAMS Admin** SACCO / microfinance back office,
reconstructed from 426 production screenshots, and translated into an architecture, data model
and delivery plan you can implement.

**Scope:** Tanzania. SACCOS (TCDC-regulated) and microfinance institutions (BoT-regulated).

---

## Documents

| # | Document | Read it when |
|---|---|---|
| 01 | [`01-system-overview.md`](01-system-overview.md) | You need the 10-minute version: what the product is, who uses it, what makes it hard |
| 02 | [`02-modules.md`](02-modules.md) | You are writing stories or screens — every screen with its fields and actions |
| 03 | [`03-flows.md`](03-flows.md) | You are designing behaviour — 12 Mermaid diagrams plus the rules behind them |
| 04 | [`04-architecture.md`](04-architecture.md) | You are choosing stack, module boundaries, or building the posting engine |
| 05 | [`05-data-model.md`](05-data-model.md) | You are writing migrations — 5 ERDs, entity dictionary, enums, constraints |
| 06 | [`06-regulatory-reporting.md`](06-regulatory-reporting.md) | You are building MSP01–MSP11, or need to know which data must be captured on day one |
| 07 | [`07-build-plan.md`](07-build-plan.md) | You are planning sprints, hiring, or deciding what to cut |

Reading order for a new team member: **01 → 02 → 03 → 04 → 05 → 06 → 07**.

---

## Source artefacts

```
F:\Wakandi\                  426 PNG screenshots, 4 XLSX templates, 2 PDF exports (originals)
<local working copy>\
  ocr\                       426 per-screenshot OCR dumps (Windows.Media.Ocr, local, gitignored)
  merged\                    145 per-route deduplicated text files (gitignored)
  route-index.json           route / screenshot-count / character-count index
```

The raw corpus is **not** in this repository — it contains real member data. Only
[`evidence/route-index.json`](../evidence/route-index.json) is committed.

Reproducing the corpus locally:

```powershell
powershell -ExecutionPolicy Bypass -File tools\corpus\ocr-all.ps1 -Source F:\Wakandi -Out .\ocr
python tools\corpus\merge.py --ocr .\ocr --out .\merged
```

See [`tools/corpus/README.md`](../tools/corpus/README.md) for requirements and known failures.

---

## What the system is, in one paragraph

A multi-tenant back office for deposit-taking cooperatives: member and group onboarding with
KYC, savings and share accounts, a four-stage loan lifecycle with guarantor fund blocking,
a multi-branch teller and till operation, a double-entry general ledger with **asynchronous**
posting, 53 operational reports, 15 financial reports, and the **Tanzanian statutory returns**
(MSP01–MSP11) in both the TCDC and Bank of Tanzania dialects.

---

## The ten findings that should shape the build

1. **Two-phase accounting posting is mandatory, not an optimisation.** The product ships a
   visible banner for transactions "submitted but not posted to accounting", with a
   `Resubmit` action. Design the outbox on day one.
2. **The ledger direction in the sample data is not textbook.** A loan repayment is recorded as
   `Dr Interest Income` alongside `Dr Staff Loan`, `Cr Bank`. Get the accounting policy agreed
   in writing before you copy it.
3. **Products are configuration, not code.** One loan product screen exposes ~60 fields across
   terms, interest, repayment strategy, arrears, guarantor rules, charges, four approval
   stages and six GL mappings.
4. **Guarantors block real money.** A guarantee creates a reservation against the guarantor's
   savings; release must be exactly-once.
5. **Two regulators, two dialects.** `MSP05`, `MSP09` and `MSP10` mean *different returns*
   under TCDC (SACCOS) and BoT (MFI). Template registry keyed by
   (dialect, code, version) — not one screen with a tenant flag.
6. **347 accounting categories are the bridge** between the chart of accounts and the
   statutory return lines. This mapping table is the most valuable configuration asset in the
   product.
7. **Reporting is 37% of the screen surface.** One engine, parameter schemas and definitions —
   not 68 bespoke screens.
8. **Approvals are the product.** Four sequential loan stages, a generic request queue, and
   `Entity : Action` permissions with multi-role users.
9. **Policy and product are separate with a signature trail.** Loans carry the
   `Product Policy Version` they were priced under. That is an audit requirement.
10. **Cash control is per till, and every till is a GL account** (`1010`, `1011`, `1012`).
    Denomination counts at open and close, variance posted, not adjusted away.

---

## What to build first

| Order | Slice | Why |
|---|---|---|
| 1 | Tenant, branch, RBAC, audit | Everything is scoped by these |
| 2 | Chart of accounts, categories, periods, posting engine | Hardest to retrofit; every report depends on it |
| 3 | Client + KYC + membership policy | No product works without a member |
| 4 | Savings, shares, reservations | Funds loans; enables guarantor blocking |
| 5 | Teller + till | Where money physically enters |
| 6 | Loan product + schedule engine + 4-stage workflow + disbursement + repayment | The business |
| 7 | Report engine + trial balance + financial statements | The month cannot close without it |
| 8 | MSP01 + MSP02 | The statutory obligation that makes the sale |

The MVP cut line and estimates are in [`07-build-plan.md`](07-build-plan.md#7-mvp-cut-line).

---

## Provenance and known gaps

**How this was produced.** The screenshots were OCR'd locally (no cloud service, no image
model). Field labels, table headers, enum values and ledger codes quoted across these documents
are verbatim from the rendered screens. Anything inferred is marked *(inferred)* or
*(recommended)*. All 21 Mermaid diagrams were parsed with mermaid 11 and render without error.

**Known gaps — do not treat as complete:**

| Gap | Detail |
|---|---|
| 3 blank OCR results | Only `reports-client-MemberVerificationReport` matters; its columns are reconstructed from the KYC tab |
| Campaigns | Present in navigation, no screens captured — scope unknown |
| Services | Settings screen captured but empty — scope unknown |
| MSP10 complaint report | No data source exists in the observed product |
| MSP11 counterparty register | Not visible in settings |
| Provision rate grids | Differ between SACCOS, MFI Type1, MFI Type2 — obtain the statutory grid |
| Loan detail "Charges" tab | Tab is present; captured column set is thin |
| Submission channel | Regulator submission is assumed to be export + portal upload |

**What was *not* done:** no authenticated access, no API probing, no source-code review of the
backend. This is a black-box reconstruction. Treat every number and enum as evidence to verify
against a live tenant before you rely on it contractually.

---

## Licensing and ethics

This is an independent interoperability/requirements analysis of a screen surface, produced for
the purpose of building a comparable system. It contains no Wakandi source code, no
proprietary assets, and no customer data beyond the incidental names visible in screenshots.
Before commercial use:

- do not copy visual identity, logos or copy text,
- do not reuse the observed tenant's member data,
- verify the regulatory line items against the current TCDC and BoT forms,
- confirm Tanzanian Personal Data Protection Act 2022 obligations with counsel,
- treat the accounting entries as observations to be validated, not as a specification of
  correct accounting.
