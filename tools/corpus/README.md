# Corpus tooling

Scripts that regenerate the evidence base for `docs/` from the original screenshots.

**Output contains personal data.** The screenshots are of a live tenant and show real member
names, phone numbers and national ID fragments. `ocr/` and `merged/` are gitignored and must
never be committed or shared. Regenerate locally, use it to check a claim, delete it.

## Requirements

- Windows PowerShell **5.1** (`Windows.Media.Ocr` is a WinRT API; PowerShell 7 cannot reach it
  without interop plumbing)
- Python 3.10+
- The screenshot folder (`F:\Wakandi` in this project)

## Regenerate

```powershell
# ~320 ms per image; 426 images takes about 75 seconds
powershell -ExecutionPolicy Bypass -File tools\corpus\ocr-all.ps1 -Source F:\Wakandi -Out .\ocr

python tools\corpus\merge.py --ocr .\ocr --out .\merged
```

`ocr-all.ps1` writes one `.txt` per screenshot plus `ocr-log.tsv` (grep `FAIL`).
`merge.py` groups by route, drops duplicated chrome lines, and writes `<route>.txt` plus
`route-index.json`.

The committed [`evidence/route-index.json`](../evidence/route-index.json) is the route/shot/
character index from the original run — it contains no member data.

## Known failures in the original run

3 of 426 images produced empty text. Only one matters:
`reports-client-MemberVerificationReport` — its columns are reconstructed from the KYC tab and
flagged as such in `docs/02-modules.md`.
