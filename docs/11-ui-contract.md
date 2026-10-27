# 11 — UI Contract

**Status:** Authoritative visual contract · Accepted 2026-10-26 (`D-020`)
**Supersedes:** the earlier styling targets (`#0F4D3A` brand, `#ECEBEC` page background,
10px card radius, 96px header). Those values are historical.

Every value below was measured on the reference at a **1837px viewport at 100% zoom**. Treat the
numbers as a contract: implement, then measure the rendered result in a real browser and compare.
A value marked *about* has a **±2px tolerance**; a hex value has none.

---

## 1. Design tokens

Define these as CSS variables. Use the token names; never a hex literal in a component and never
a near-match.

```css
:root {
  /* Brand */
  --brand-primary: #057573;        /* active sidebar pill, active tab, branch name, primary buttons */
  --brand-primary-fab: #037674;    /* floating chat button */
  --brand-logo-teal: #479b92;      /* sidebar footer wordmark */
  --brand-tenant-blue: #29aae3;    /* tenant blue: logo fallback monogram, chart series */
  --avatar-blue: #377ab1;          /* user avatar circle */

  /* Surfaces */
  --bg-page: #ebe9e9;              /* canvas behind the cards, gaps between cards */
  --bg-surface: #ffffff;           /* header, sidebar, cards, chart card */
  --bg-subtle: #f8f9fa;            /* hairline gaps and subtle fills */

  /* Borders */
  --border-card: #e2e8f0;          /* 1px border on cards */
  --border-chrome: #dee2e6;        /* header bottom, sidebar right, scrollbar */
  --grid-line: #e5e5e5;            /* chart gridlines */

  /* Text */
  --text-strong: #000000;          /* KPI values, chart title, inactive tab labels */
  --text-body: #495057;            /* sidebar labels, icons, header title, user name, language */
  --text-muted: #6c757d;           /* header sub-label, chevrons */
  --text-label: #64748b;           /* KPI card labels */
  --text-axis: #666666;            /* chart axis labels */
  --text-on-primary: #ffffff;      /* text and icon on teal */

  /* Semantic accents: icon/stroke + tinted background */
  --accent-teal: #057573;          --accent-teal-bg: #e0eeed;    /* Total Members */
  --accent-red: #c75a43;           --accent-red-bg: #f8eae7;     /* money out, risk, chart bars */
  --accent-yellow: #e6c120;        --accent-yellow-bg: #fcf7e3;  /* warnings */

  /* Chart */
  --chart-bar: #c75a43;
}
```

Both Bootstrap grays (`#495057`, `#6c757d`, `#dee2e6`, `#f8f9fa`) and Tailwind slate
(`#64748b`, `#e2e8f0`) appear in the reference. Define both exactly as listed; do not normalise
one into the other.

**Type:** Roboto, weights 400 / 500 / 600 / 700, sans-serif fallback.

---

## 2. Shell structure

Fixed header across the full width, fixed left sidebar, scrollable main area on `--bg-page`.

```
┌──────────────────────────── header (about 97px, fixed) ────────────────────────────┐
├──────────────┬──────────────────────────────────────────────────────────────────────┤
│  sidebar     │  main content (--bg-page)                                            │
│  about 300px │  tab card → 4 KPI cards → chart card                                 │
│  fixed       │  about 22px from sidebar, 20px between cards                         │
└──────────────┴──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Header

| Element | Value |
|---|---|
| Height | 68px |
| Background | `--bg-surface` |
| Bottom border | 1px `--border-chrome` |
| Position | fixed, full width, `14px` side padding |

**Left group**, 10px gap:

- Tenant logo: the institution's own lockup, **28px tall, max 190px wide**, `object-contain`.
  No circle and no ring: the mark keeps its intrinsic ratio. It starts on the 14px header
  padding and ends on the sidebar's right edge (190 + 14 = 204).
- Stacked lines beside it: institution name, `--fs`, weight 600, `--text-body`; dialect and
  code beneath at `--fs`, `--text-muted`.

**Right group**, in order, 24px gaps:

1. Tanzania flag, **24 × 16**, plus "English" (`--text-body`) and a down chevron
   (`--text-body`).
2. Building icon, 16px `--brand-primary`, then two stacked lines: branch name,
   `--brand-primary`, weight 600, `--fs`; beneath it a check-circle plus "Open",
   `--brand-primary`, `--fs`.
3. User avatar: **34px circle**, gradient, white bold initials, `--fs`; name, `--fs`, weight
   600, `--text-body`; then a down chevron.

### 3.1 Tenant branding

The header mark belongs to the **institution**, the sidebar wordmark belongs to the
**product**. Keep them apart: AIMSCAMS is the thing that runs the back office, the tenant is
the SACCO whose name and mark sit in the header.

| Concern | Ruling |
|---|---|
| Asset | `apps/web/public/brand/mafanikio-logo.png` (300 × 43), declared once in `apps/web/src/lib/brand.ts` |
| Component | `InstitutionLogo` renders the image at its ratio; a failed load degrades to a 40px tenant-blue monogram, never a broken image |
| Fallback trigger | `onError` on the image, so a missing file costs one silently handled request and no layout shift |
| Production | The slot reads `organisation.logoUrl`; the demo build pins the Mafanikio lockup |
| Not the tenant's | Sidebar footer wordmark, auth screens, app icon |

Placements still open, in order of value: a logo URL plus upload in **Settings → General**
(the header then reads it per tenant), the **sign-in card** for white-label installs, a
**136 × 136 app icon** derived from the emblem, and a **compact emblem** for the collapsed
sidebar.

---

## 4. Sidebar

| Element | Value |
|---|---|
| Width | about **300px** |
| Collapsed width | **76px** — measured icon axis x=38 (left padding 28 + 20px icon), doubled so the icon does not move when collapsed |
| Background | `--bg-surface` |
| Right border | 1px `--border-chrome` |
| Scrollbar | own thin scrollbar, `--border-chrome` |
| Item pitch | about **60px** vertically |
| Icon | 20px outline |
| Label | about **18px**, `--text-body` |
| Icon-to-label gap | about **12px** |
| Left padding | about **28px** |

**Active item** — full-width pill from x≈12 to x≈276, **44px** tall, radius about **8px**,
background `--brand-primary`, white label at weight 600 and a white icon.

**Item order** (exactly):

| # | Item | Chevron |
|---|---|---|
| 1 | Dashboard (active in the reference) | — |
| 2 | Client | — |
| 3 | Accounts | yes |
| 4 | Transactions | yes |
| 5 | Accounting | yes |
| 6 | Requests | — |
| 7 | Messages | — |
| 8 | Campaigns | yes |
| 9 | Reports | yes |
| 10 | Import | yes |
| 11 | Business Account | — |
| 12 | Settings | yes |

Chevrons are `--text-muted`, right-aligned at about **x=250**.

**Collapse control** — a **44px** white circle with a 1px `--border-chrome` border, chevron-left
in `--brand-primary`, straddling the sidebar's right edge near the bottom (about **y=813**).

**Footer**, fixed to the bottom above a thin top line: centred wordmark in `--brand-logo-teal`,
bold; copyright beneath it, about **14px**, `--text-muted`, wrapping to two lines.

---

## 5. Main content

Background `--bg-page`. About **22px** from the sidebar, about **20px** between cards.

### 5.1 Tab card

| Element | Value |
|---|---|
| Height | about **104px** |
| Background / border / radius | `--bg-surface` / 1px `--border-card` / about **12px** |
| Tabs | Overview (active), Members, Loans |
| Active tab | **44px** tall pill, about **154px** wide, background `--brand-primary`, white text and bar-chart icon, radius about **8px** |
| Inactive tab | no background, text `--text-strong` (the reference shows `#000029` or black), 20px outline icon, label about **19px** |
| Gap between tabs | about **30px** |

### 5.2 KPI row

Four cards, **equal width**, about **352px** each, about **185px** tall, gap about **22px**.
Each: `--bg-surface`, 1px `--border-card`, radius about **12px**, padding about **30px**.

- Label top-left: about **18px**, weight 500, `--text-label`; may wrap to two lines.
- Badge top-right: **66px** circle, tinted background, 1px ring and icon in the accent colour.
- Value bottom-left: about **30px**, weight 700, `--text-strong`.

| # | Label | Value | Icon | Accent / tint |
|---|---|---|---|---|
| 1 | Total Members | 1,111 | users | `--accent-teal` / `--accent-teal-bg` |
| 2 | Outstanding Loan Principal | TZS 93,715,396 | wallet | `--accent-red` / `--accent-red-bg` |
| 3 | Principal in Arrears | TZS 16,180,416 | warning triangle | `--accent-yellow` / `--accent-yellow-bg` |
| 4 | Clients in Arrears | 23 | user-minus | `--accent-red` / `--accent-red-bg` |

### 5.3 Chart card

`--bg-surface`, 1px `--border-card`, radius about **12px**, padding about **30px**.

- Title "FundsInVsFundsOut": about **20px**, weight 700, `--text-strong`.
- Bars: solid `--chart-bar`, about **77px** wide, **square corners**.
- Y axis: labels "TZS 50M … TZS 15M" in **5M steps**, about 16px, `--text-axis`.
- Gridlines: horizontal only, 1px `--grid-line`. No vertical gridlines.
- Value label above each bar, e.g. "47.5M", about 16px, `#111111`.

### 5.4 Floating elements

- Chat button: bottom-right, **90px** circle, background `--brand-primary-fab`, white outlined
  chat-bubble icon, soft shadow.
- Ignore the dark vertical toolbar (`#1c1c1c`) at the right edge and the browser scrollbar. They
  are screen-recorder and browser overlays, not part of the application.

---

## 6. Rules

1. Tokens only. **No new colours, no near-matches.**
2. Cards: white, 1px `--border-card`, about 12px radius, **no heavy shadow**.
3. `--brand-primary` is the only primary-action and active-state colour.
4. Red `--accent-red` marks money-out and risk. Yellow `--accent-yellow` marks warnings.
5. Measurements were taken at 1837px / 100% zoom. Keep proportions and stay responsive instead
   of hard-coding fixed pixel widths that break below the measured viewport.

---

## 7. AIMSCAMS substitutions

The reference is another company's product. Measurements, colours, spacing and component anatomy
are adopted exactly; **identity is ours** (`D-013`, `D-020`). Until `O-010` is ruled on, apply
these substitutions:

| Reference text / mark | AIMSCAMS value |
|---|---|
| Sidebar wordmark "WAKANDI" | **AIMSCAMS** — same position, size, weight and `--brand-logo-teal` colour |
| Footer "© 2026 Wakandi. All rights reserved." | **© 2026 AIMSCAMS. All rights reserved.** |
| Tenant "MFSL MFI" / "101457" | Synthetic demo institution, clearly fictional |
| Branch "MFSL MWANZA" | Synthetic branch for the same demo institution |
| User "Ally Juma Ally" / "AA" | Synthetic demo user; initials must match the chosen name |

No real member data, no observed tenant's staff names, no observed tenant's branding in shipped
UI. Demo data is generated, never copied (`D-014`).

---

## 8. Verification checklist

Before reporting any UI work as done, load it in a real browser and record:

- [ ] Header height, background, bottom border; no duplicate user block.
- [ ] Tenant circle 60px, name and code sizes/colours.
- [ ] Flag, language, branch block, avatar 50px, name and chevrons.
- [ ] Sidebar width, pitch, icon size, label size, left padding.
- [ ] Active pill geometry (x 12→276, height 44, radius 8) and colours.
- [ ] All 12 items in the stated order; chevrons present exactly where listed.
- [ ] Collapse control 44px, straddling the edge, chevron in `--brand-primary`.
- [ ] Footer wordmark and copyright, two-line wrap.
- [ ] Tab card height, active pill 44px / about 154px / radius 8.
- [ ] Four KPI cards: width, height, gap, padding, label/value sizes, badge 66px, accent pairs.
- [ ] Chart title, bar colour and width, square corners, horizontal-only gridlines, axis steps.
- [ ] Chat button 90px, colour, shadow.
- [ ] **Collapsed sidebar**: icons centred on the same axis as expanded, no clipped labels,
      active state still visible, tooltip or accessible name on each icon.
- [ ] **Every dropdown**: opens, closes on outside click and Escape, keyboard navigable, focus
      returns to the trigger, no clipped menu inside a scrolling container.
- [ ] Console free of errors on every page visited.
- [ ] No horizontal scrollbar at 1837px, and none at 1280px.

Report the measured values, not an impression. "Looks right" is not evidence.
