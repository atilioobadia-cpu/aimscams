# Reference screenshot calibration

## Scope

The reference corpus contains 577 image files with mixed dimensions. A single viewport/DPR cannot
be assumed for every page. Calibrate each page from the header and sidebar edges in its selected
`FULL.png`; use the same CSS viewport and DPR for the local Playwright capture. Full-page image
height may include page scroll, so it does not by itself identify the viewport height.

## Measured page captures

| Page | Reference | Pixel size | Header edge | Sidebar edge | Inferred DPR | CSS viewport |
|---|---|---:|---:|---:|---:|---:|
| Clients | `F:\Wakandi\clients\FULL.png` | 1838 × 1368 | y=95 px | x=300 px | 1.25 | 1470 × 1094 |
| Loans | `F:\Wakandi\account-loan\FULL.png` | 1838 × 1241 | y=76 px | x=240 px | 1.0 | 1838 × 1241 |

Both captures resolve to a **76px header** and **240px expanded sidebar** in CSS pixels. The Clients
capture resolves to a 16px horizontal content inset and 18px vertical inset. The local app shell now
measures 76px and 240px; its collapsed rail measures 76px.

## Live browser measurement

- Tool: visible Codex in-app browser, Playwright-backed DOM evaluation.
- Route: `/clients` at `http://localhost:3000/clients`.
- CSS viewport: 1470 × 1094; `devicePixelRatio`: 1.0 in this browser surface.
- Local header: 76px; expanded rail: 240px; collapsed rail: 76px.
- Clients title card: x=256, y=94, width=1198px, height=84px.
- Clients toolbar: x=256, y=196, width=1198px, height=67.3px.
- Toolbar controls: search 230×42px, type 80×42px, status 90×42px, Add filters 158×42px.
- Table: header row 44.3px, body row 68.3px, 1495px content width in a 1197px viewport.
- No console errors or warnings were present during this capture.

The in-app browser is DPR 1, so its screenshot is useful for visible inspection but is not a physical
pixel-for-pixel capture for the Clients reference. Playwright screenshot comparison must create a
1470×1094 context at DPR 1.25 for Clients. The Loans comparison needs an 1838×1241 context at DPR 1.

## Calibration method

1. Read each selected reference image's pixel dimensions.
2. Sample the horizontal header edge and vertical sidebar edge away from text and overlays.
3. Compare those measurements against candidates DPR 1, 1.25, 1.5 and 2; select the DPR that yields
   the same CSS geometry as the running page.
4. Record the viewport, DPR, shell edges and selected reference path in `tools/ui-compare/pages.json`.
5. Capture and compare at that page's calibrated dimensions. Do not rescale references based only on
   image width or use one page's calibration for the entire corpus.

## Remaining calibration work

- Other reference pages still need individual edge checks; their image heights and capture scales vary.
- The existing harness does not yet apply reliable structural masks or score control-level geometry.
- No corpus-wide pass rate should be reported until all page calibrations and masks are rechecked.
