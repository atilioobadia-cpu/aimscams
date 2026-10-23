# Evidence

Non-sensitive artefacts from the reverse-engineering pass. The raw corpus is **not** here.

| File | What it is |
|---|---|
| `route-index.json` | One record per distinct screen: route slug, screenshot count, OCR character count, line count. Use it to check coverage and to prioritise which screen to read when a doc is ambiguous. |

## What was analysed

| Item | Count |
|---|---|
| Files in the source folder | 432 |
| Screenshots (PNG) | 426 · 108.9 MB |
| Import templates (XLSX) | 4 |
| Report exports (PDF) | 2 |
| Distinct routes after dedupe | 145 |
| Merged corpus size | ~162 000 characters |
| OCR failures (empty text) | 3 |

## Not committed, on purpose

- `ocr/` — 426 per-screenshot text dumps
- `merged/` — 145 per-route deduplicated documents
- the original screenshots

All three contain real member names and phone numbers. See the privacy section in the
[root README](../README.md#evidence-and-privacy) and D-012 in
[`DECISIONS.md`](../DECISIONS.md).

Regenerate locally with [`tools/corpus`](../tools/corpus/README.md).

## Reading a route record

```json
{
  "route": "transaction-teller-transaction",
  "shots": 29,
  "ocr_ok": 29,
  "chars": 6887,
  "lines": 381
}
```

High `shots` with low `chars` means many near-identical captures (tabs or modal states).
Low `shots` with high `chars` means one dense screen — usually a report or a configuration page.
