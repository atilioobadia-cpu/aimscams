# P01-T01 — Settings › Services

State: `DIFFERENCES_OPEN`

Reference: `https://cams.wakandi.co.tz/settings/service-provider`
Local: `http://localhost:3000/settings-service-provider`

## Goal check (M9)

- Does this move the page to `VERIFIED_MATCH`? Yes — it is the first page in the master plan and its shell is shared by every later page.
- Anything outside the plan? No. The only non-page work is audit tooling (`scripts/cdp.js`, `scripts/measure-dump.js`, `scripts/measure-diff.js`, `scripts/parity-probe.js`), which section 3 requires.

## Measurement environment

| | |
|---|---|
| Browser | Chrome 156.0.8078.80, dedicated profile `C:\Users\atili\chrome-parity`, CDP on 127.0.0.1:9222 |
| Wakandi | signed in, read-only |
| Viewports | 1920×1080@1, 1536×864@1.25, 1280×590@1.5 |
| Collector | `scripts/measure-dump.js` (no element text captured) |
| Diff | `scripts/measure-diff.js` → `docs/audit/parity/P01-T01-services.md` |

## T1 — Inspect Wakandi live (done)

Route `/settings/service-provider`, state default, 1920×1080@1. The page is a page-header card containing an icon tile and the title "Services". No table, no actions, no empty state.

Measured reference values:

| Element | Value |
|---|---|
| `html` font-size | 13.44px (root scale for the whole product) |
| `body` | font-size 13.44px, line-height normal, color rgb(0,0,0), bg rgb(235,233,233) |
| `header` | 1920×64.67, bg #fff |
| header toolbar | 1920×47.03 at y 8.15; start column at x 13.44 |
| tenant avatar | 40.31×40.31, image inset 2px (36.31) |
| tenant name | 13.44px / 500 / 16.8 line-height / #495057 |
| tenant id | 11.76px / 400 / #6c757d |
| language select | 94.07×30.79, label 11.76px, bg #fff, chevron 13.44 |
| branch button | 127.98×41.78, icon 15.13, name 11.76/500, status 9.408/400 |
| user block | avatar 33.59, name 11.76/600 lh 14.112, chevron 10.08 |
| sidebar | 200 wide, bg #fff, nav area 199.33×941.46 |
| top-level row | control 185.9×29.44 at x 6.72; icon 16×13.44 at x 16.79; label at x 39.51, 13.44px |
| link-type row step | 42.86 (section 32.79 + gap 10.07) |
| group-type row step | 39.52 (control 29.44 + gap 10.08) |
| submenu row | 185.9×28.77, step 29.77, label 12.768px |
| active submenu row | 185.9×30.1, 600, #fff on rgb(5,117,115) |
| expanded group | section bg rgb(230,241,241), header 600 in rgb(5,117,115) |
| sidebar footer | 199.33×73.88, logo 80×11.61, copyright 11.76px #6c757d |
| sidebar toggle | 30×30 at (169.33, 983) |
| main content | x 200, w 1720, bg rgb(235,233,233), padding 13.44 |
| page-header card | 1693.13×75.24 at (213.44, 78.1), bg #fff, radius 8, padding 20.16, no shadow |
| icon tile | 33.59×33.59, bg rgb(225,238,238), icon 14.112 in rgb(5,117,115) |
| title | 18.144px / 700 / lh 21.7728 / #495057, 12.1px right of the tile |

## T2 — Inspect AIMSCAMS in the same state (done)

Same route, same 1920×1080@1. 259 visible elements. Differences found:

| Element | Wakandi | AIMSCAMS | Delta |
|---|---|---|---|
| body font-size | 13.44 | 12.8 | −0.64 |
| body line-height | normal | 19.2 | — |
| body color | rgb(0,0,0) | rgb(73,80,87) | — |
| header start column | x 13.44, y 8.15, h 47.03 | x 14, y 12, h 40 | — |
| tenant avatar image | 36.31 | 35.99 | −0.32 |
| tenant name weight | 500 | 600 | — |
| tenant id font-size | 11.76 | 12.8 | +1.04 |
| language control | 94.07×30.79 | 127.2×29.25 | +33.13 / −1.54 |
| language label | 11.76 | 11.5 | −0.26 |
| branch block | 127.98×41.78 | 112.79×32.7 | −15.19 / −9.08 |
| branch status text | 9.408 | 9.33 | −0.078 |
| user avatar | 33.59 | 34 | +0.41 |
| user name | 11.76 / 600 / lh 14.112 | 12.8 / 700 / lh 12.8 | — |
| sidebar row | 185.9×29.44 | 180.67×30 | — |
| sidebar row step | 42.86 / 39.52 | 38 | — |
| sidebar icon | 16×13.44 | 14×14 | — |
| sidebar label | 13.44 | 13.34 | −0.1 |
| submenu row | 28.77 / step 29.77 / 12.768 | 30 / step 34 / 13.34 | — |
| card radius | 8 | 6 | −2 |

## T3 — Diff

Machine diff: `docs/audit/parity/P01-T01-services.md` (named-slot probe; see T5).

## T4 — Fix plan

Shared first (M10), because all of these live in shell components used by every page:

1. `apps/web/src/app/globals.css`
   - body: font-size 13.44px, line-height normal, color rgb(0,0,0)
   - `--fs` 12.8 → 13.44 (cascades to `fs-text`, table text, helper text)
   - `--fs-title` 20 → 18.144
   - `--card-radius` 6 → 8
   - sidebar: row 29.44, subitem 28.77, gaps 10.08 (+3.35 for link rows), icon 16, labels 13.44 / 12.768, toggle 30
2. `app-header.tsx` — start column x 13.44, toolbar height 47.03, avatar 40.31 with 2px inset image, name weight 500, id 11.76, language control 94.07×30.79 with 11.76 label, branch block 127.98×41.78 with 15.13 icon and 9.408 status, user avatar 33.59, name 11.76/600 lh 14.112, chevron 10.08.
3. `app-sidebar.tsx` — row heights, gaps, icon size, submenu label size, active row 30.1, group section background rgb(230,241,241) and 600 teal header.
4. `page-header.tsx` — card variant: padding 20.16, radius 8, min-height 75.24, title 18.144/700 lh 21.7728, icon tile 33.59 with 14.112 icon and 12.1 gap.
5. Services page — use the measured page-header card.

No backend work: Wakandi's Services page has no data surface, so there is nothing to model or seed.

## T5 — Implement

Shared tokens and components first, then the page. Every change below is a measured value, not an estimate.

## T6 — Verify

Re-measure both sites at 1920×1080@1, 1536×864@1.25, 1280×590@1.5. Zero differences required for color, typography and states; ≤1px for size and position. Also check: sidebar collapsed, Settings group collapsed, dropdowns (language, branch, user), hover/focus/active, and the 1280 viewport where the branch block hides.

## T7 — Regression

Console clean on the touched routes, lint, typecheck, tests, build, and a Playwright regression test for the shell + Services page.

## T8 — Record

Evidence in `docs/audit/measure/` and `docs/audit/parity/`, `status.md` row updated, one commit.

## T9 — Goal check and next task

Next: `P01-T02` Settings › Roles.

## Open questions

Recorded in `docs/audit/NEEDS-HUMAN.md`, not guessed:

- AIMSCAMS navigation contains entries Wakandi does not have (for example System logs). Exact menu parity conflicts with the product blueprint until decided.
