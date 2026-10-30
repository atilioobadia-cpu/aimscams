# Phase 2 — reference corpus, OCR and page specs

The 426-screenshot corpus of the observed product was turned into one machine-readable
spec per screen: text, its position, and measured shell geometry. Those specs are the
input to Phase 3 (comparison) and Phase 5 (implementation).

## What was produced

| Artefact | Count | Committed |
| --- | --- | --- |
| Inventoried images | 438 | metadata only (`wakandi-inventory.json`) |
| Route slugs | 152 | yes (`wakandi-pages.json`) |
| Stitched pages | 423 | no — contains member data |
| OCR'd representative pages | 152 | no — `wakandi-ocr.json` contains member data |
| Generated page specs | 152 | no — `wakandi-spec/` contains member data |
| Layout measurements | 152 | yes (`wakandi-layout.json`) |

Hard rule 6 forbids publishing member data from the observed product. Stitched
screenshots, raw OCR text and the generated specs all quote real names, phone numbers and
balances, so `.gitignore` keeps them on the workstation. The committed metadata is
slug, dimensions, file names and colours; the scripts in `tools/corpus/` regenerate
everything locally.

## Method

1. `wakandi-extract.py` — walks the corpus, derives a route slug from each file path and
   the `screencapture-cams-wakandi-co-tz-…` filename pattern, and stitches multi-part
   captures into one page per slug (430 of 438 files grouped; 8 are logos and PDF
   exports). Split pairs are detected by pixel overlap so the seam does not duplicate text.
2. `wakandi-ocr.py` — RapidOCR (ONNX, no system binary) on one representative page per
   slug, capped at 900 × 1400 px, boxes scaled back to source pixels. Resumable.
3. `wakandi-ocr-tile.py` / `wakandi-ocr-tile2.py` — very tall (`MemberVerificationReport`,
   `CashBook`, `ExpectedLoanRepaymentsReport`) and very wide (`ActiveLoanReport`) pages are
   re-OCR'd in overlapping tiles; a single downsampled pass returned 0–2 boxes on them.
4. `wakandi-layout.py` — measures sidebar width, header height and dominant colours after
   downsampling to 1200 px tall.
5. `wakandi-spec-gen.py` — groups boxes into lines (y tolerance 14 px), orders each line by
   x, and writes `wakandi-spec/<slug>.md` plus `INDEX.md` and `NEEDS-HUMAN.md`.

## Measured shell geometry

| Property | Value | Pages agreeing |
| --- | --- | --- |
| Sidebar width | 231 px | 81 / 152 |
| Header height | 76 px | 103 / 152 |
| Sidebar background | `#ffffff` | majority |
| Body background | `#ffffff` | majority |
| Accent (sidebar active, header controls) | `#067272`, `#029696` | majority |

Outliers are explained, not noise:

- Report pages whose captured canvas is wider than the viewport report a 700–960 px
  "sidebar" — the measurement found the left edge of the report body, not the shell.
- `clients` and `clients-create` report a 94–95 px header because the list toolbar sits
  inside the captured header band.
- The three `authentication` screenshots and the two logo files have no shell.
- `account-loan-application-*` detail pages report 167–168 px: the capture starts mid-scroll.

## Recurring patterns

- **Header chrome** is identical on ~140 pages: institution name (left), a 6-digit user
  code, branch selector (`Main Branch`), language selector (`English`), user name (right).
  Our contract replaces the institution name with `{dialect} SACCOS` and drops the code.
- **Page title band** sits at y ≈ 126–140 with the title on the left and page actions
  (`Add Groups`, `Add Ledgers`, date range) right-aligned on the same line.
- **Tables** carry an `Actions` column on 135 of 152 pages. The header row is
  `Account Name | Type | O/P Balance (TSh) | C/L Balance (TSh) | Actions` on the chart of
  accounts, i.e. text, category, opening balance, closing balance, row menu.
- **Money** is rendered `Dr 2,323,429.80` / `Cr 107,000,000.00` — sign carried by the
  `Dr`/`Cr` prefix, not by a leading minus.
- **Empty state** text `No data` appears on 16 pages; `Search` on 26; `Showing` on 8.
  Pagination vocabulary is `Previous` / `Next` with a page size control.

## Known OCR defects (do not trust literally)

- `MFSL MFI` is read as `MFSL MF1` on 30+ pages; `English` as `Engllsh`; `Qroup` for
  `Group`; `Actlons` for `Actions`. Read these as the intended word.
- `NEEDS-HUMAN.md` lists the 4 genuinely unusable captures: two logo files (no layout) and
  two extra pages of the `MemberVerificationReport` PDF export, which are covered by the
  representative page. None block Phase 3.
- Charts and icon-only controls produce no OCR text; their presence is inferred from the
  layout, not read.

## Next

Phase 3 measures the live AIMSCAMS pages in Playwright (DOM text, computed styles, bounding
boxes) and diffs them against these specs, page by page, into `docs/audit/comparison.md`.
