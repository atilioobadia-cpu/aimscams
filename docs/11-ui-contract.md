# 11 — UI Contract

**Status:** Authoritative visual contract · Accepted 2026-10-26 (`D-020`) · shipped values recorded 2026-10-27
**Supersedes:** the earlier styling targets (`#0F4D3A` brand, `#ECEBEC` page background,
10px card radius, 96px header). Those values are historical.

Every value below is the **shipped contract**, measured on the running app at **1837×1080** and
**1280×800**, 100% zoom, with Roboto loaded. It is the gate: implement, then measure the rendered
result in a real browser and compare. A value marked *about* has a **±2px tolerance**; a hex value
has none.

**Geometry note.** `D-020` adopted the reference's anatomy. The shipped build implements that
anatomy at a denser scale: **12.8px text, a 68px header, a 204px rail and 36px rows**. `D-020`'s
97px / 300px / 44px / 12px numbers describe the reference measurements, not this gate. Every
rendered text node is **12.8px**; a node at any other size is a defect.

---

## 1. Design tokens

Define these as CSS variables. Use the token names; never a hex literal in a component and never
a near-match.

```css
:root {
  /* Type: one size, everywhere */
  --fs: 12.8px;
  --fs-title: var(--fs);
  --fs-kpi: var(--fs);
  --fs-body: var(--fs);

  /* Brand */
  --primary: #057573;              /* active sidebar pill, active tab, branch name, primary buttons */
  --primary-tint: #e6f1f1;         /* teal icon badge, net-in pill, hover fills */
  --primary-fab: #037674;          /* floating chat button */
  --brand-logo-teal: #479b92;      /* sidebar footer wordmark */
  --brand-tenant-blue: #29aae3;    /* portfolio savings segment */
  --avatar-blue: #377ab1;          /* user avatar circle */

  /* Surfaces */
  --page-bg: #ebe9e9;              /* canvas behind the cards */
  --surface: #ffffff;              /* header, sidebar, cards, chart card */
  --tab-inactive-bg: #f8fafc;      /* subtle fills and hover */

  /* Borders and chrome */
  --border: #dee2e6;               /* cards, header bottom, sidebar right */
  --border-header: #c3c6ca;        /* 1px header shadow line */
  --grid-line: #e5e5e5;            /* chart gridlines */

  /* Text */
  --text-strong: #111827;          /* KPI values, chart title, inactive tab labels */
  --text-heading: #495057;         /* sidebar labels, header title, user name */
  --text-muted: #6c757d;           /* header detail, KPI labels, chevrons */
  --text-axis: #666666;            /* chart axis labels */
  --text-on-primary: #ffffff;

  /* Semantics: icon/stroke + tinted background */
  --danger: #dc3545;               --danger-bg: #f8eae7;
  --accent-yellow: #e6c120;        --accent-yellow-bg: #fcf7e3;
  --chart-out: #c75a43;            /* funds-out bar */

  /* Shared geometry */
  --header-height: 68px;
  --sidebar-width: 204px;
  --sidebar-collapsed-width: 76px;
  --sidebar-footer-height: 73px;
  --sidebar-row-height: 36px;
  --sidebar-subitem-height: 28px;
  --content-padding: 18px;
  --icon-size: 20px;
  --icon-box-size: 34px;
  --card-radius: 8px;
  --control-radius: 5px;
  --pill-radius: 6px;

  /* Spacing, in rendered pixels */
  --space-4: 4px;   --space-6: 6px;   --space-8: 8px;
  --space-10: 10px; --space-12: 12px; --space-14: 14px;
  --space-16: 16px; --space-18: 18px; --space-24: 24px;
  --space-32: 32px;
}
```

**Type:** Roboto, weights 400 / 500 / 600 / 700, sans-serif fallback. Every text node renders at
`--fs`; the old 18px labels, 30px KPI values and 20px chart titles are not part of this build.

**Colour rules.** `#057573` is the only primary/active colour. `#dc3545` marks money-out and risk
icons; `#c75a43` is the funds-out chart series. `#e6c120` marks warnings. `#29aae3` is the tenant
blue in the portfolio bar. Do not normalise Bootstrap (`#495057`, `#6c757d`, `#dee2e6`) into
Tailwind slate; use the values above.

---

## 2. Shell structure

Fixed header across the full width, fixed left sidebar, scrollable main area on `--page-bg`.

```
┌──────────────────────────── header 68px, fixed ────────────────────────────┐
├──────────────┬──────────────────────────────────────────────────────────────┤
│  sidebar     │  main content (--page-bg)                                    │
│  204px fixed │  18px inset; tab card 54px; 20px gap; 8 KPI cards (4/row);  │
│  76px closed │  chart + portfolio; 76px bottom reserve for the chat button  │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

The content box starts at **x = 204 + 18 = 222**. The tab card starts at
**y = 68 + 18 = 86**. The sidebar and header are fixed; the main area scrolls. The bottom padding
is **76px** so the floating chat button never covers the last card.

---

## 3. Header

| Element | Value |
|---|---|
| Height | **68px** |
| Background | `--surface` |
| Bottom border | 1px `--border` |
| Shadow | 1px `0 1px 0 0 --border-header` (`#c3c6ca`) |
| Position | fixed, full width, `14px` side padding |

**Left group**, 10px gap:

- Tenant logo: the institution's own lockup, **28px tall, max 190px wide**, `object-contain`.
  It starts on the 14px header padding and ends on the sidebar's right edge (190 + 14 = 204).
  No circle and no ring. A missing image degrades to a **40px** tenant-blue monogram, never a
  broken image.
- Stacked lines beside it: institution name, `--fs`, weight 600, `--text-heading`; dialect and
  code beneath at `--fs`, weight 400, `--text-muted`.

**Right group**, in order, 24px gaps:

1. Tanzania flag, **24 × 16**, plus "English" (`--fs`, `--text-heading`) and a down chevron.
   The trigger measures **105.4 × 31.2**.
2. Building icon, 16px `--primary`, then two stacked lines: branch name, `--primary`, weight 600,
   `--fs`; beneath it a check-circle plus "Open", `--primary`, `--fs`. The block measures
   **119.6 × 32**.
3. User avatar: **34px circle**, gradient, white bold initials, `--fs`; name, `--fs`, weight 600,
   `--text-heading`; then a down chevron. The trigger measures **209.2 × 46**.

### 3.1 Tenant branding

The header mark belongs to the **institution**; the sidebar wordmark belongs to the **product**.
AIMSCAMS runs the back office; the tenant is the SACCO whose name and mark sit in the header.

| Concern | Ruling |
|---|---|
| Demo asset | `apps/web/public/brand/mafanikio-logo.png` (300 × 43), declared once in `apps/web/src/lib/brand.ts`; it is the fallback when the tenant has no logo |
| Component | `InstitutionLogo` renders the image at its ratio; a failed load degrades to a 40px tenant-blue monogram |
| Fallback trigger | `onError` on the image, so a missing file costs one silently handled request and no layout shift |
| Production | The slot reads the organisation logo (uploaded bytes served by the authenticated API, or an external `logoUrl`), cache-busted by `logoUpdatedAt`; no logo falls back to the demo lockup |
| Not the tenant's | Sidebar footer wordmark, auth screens, app icon |

Placements still open: the **sign-in card** for white-label installs, a **136 × 136 app icon**
derived from the emblem, and a **compact emblem** for the collapsed sidebar. The logo URL plus
upload shipped with ST-01 (`D-031`).

---

## 4. Sidebar

| Element | Value |
|---|---|
| Width | **204px** |
| Collapsed width | **76px** |
| Background | `--surface` |
| Right border | 1px `--border` |
| Scrollbar | own thin scrollbar, `--border` |
| Item pitch | **40px** vertically |
| Row | **36px** tall, **187.3px** wide at x=8 (Settings link is 34px tall) |
| Sub-item | **28px** tall, 187.3px wide at x=8, text starts at x=45 |
| Icon | **20px** outline, on axis **x=28** expanded *and* collapsed |
| Label | **12.8px**, weight 400, `--text-heading` |
| Icon-to-label gap | **8px** |
| Left padding | **20px** inside the row (row x=8 + padding 20 = icon x=28) |

**Active item** — pill from x=8 to x=195.3, **36px** tall, radius **6px**, background `--primary`,
white label at weight 600 and a white icon. Inactive rows are transparent with a `--text-heading`
label and icon; hover uses `--tab-inactive-bg`.

**Item order** (exactly):

| # | Item | Chevron | Destination |
|---|---|---|---|
| 1 | Dashboard (active) | — | `/dashboard` |
| 2 | Client | — | `/clients` |
| 3 | Accounts | yes | `/accounts` |
| 4 | Transactions | yes | `/transactions` |
| 5 | Accounting | yes | `/accounting` |
| 6 | Requests | — | `/requests` |
| 7 | Messages | — | `/messages` |
| 8 | Campaigns | — | `/campaigns` |
| 9 | Reports | yes | `/reports` |
| 10 | Import | yes | `/import` |
| 11 | Business Account | — | `/business-account` |
| 12 | Settings | group chevron | `/settings/general` |

Every row is an `<a href>` and resolves to a page or the shared `ComingSoon` placeholder
(`D-027`). Campaigns is **not disabled**: it carries a plain `Soon` note at `--fs`, weight 400,
`--text-heading`, and still links. Chevrons mark Accounts, Transactions, Accounting, Reports and
Import; Settings has a separate group-chevron button in the remaining width of its row.

**Settings submenu** — nine links at 28px pitch: General, Accounting, Branches, Products, Policies,
Users, Roles, Services. The parent link is 155.3 × 34; the chevron button sits in the rest of the
187.3px row. Clicking a sub-link navigates; clicking the chevron toggles.

**Collapse control** — a **44px** white circle with a 1px `--border` border, chevron-left in
`--primary`, straddling the sidebar's right edge. Its centre is **x=203.3** expanded and **x=75.3**
collapsed; it sits **6px above the footer**.

**Footer**, fixed to the bottom above a 1px top line, **73px** tall, padding **6px 8px**, 4px row
gap: centred wordmark **AIMSCAMS**, 12.8px, weight 700, `--brand-logo-teal`; copyright beneath it,
12.8px, `--text-muted`, wrapping to two lines (`© 2026 AIMSCAMS.` / `All rights reserved.`).

**Collapsed rail** — 76px. Rows are 51.3px wide at x=12; icons stay on x=28, labels are removed,
the active pill stays teal at radius 6, and hover/focus shows a tooltip with the item name. The
footer stays visible.

---

## 5. Main content

Background `--page-bg`. Content starts **18px** after the sidebar, **18px** below the header, and
ends **18px** from the right edge. Cards are separated by **20px** vertically; the KPI grid uses
**12px** horizontal and vertical gaps.

### 5.1 Tab card

| Element | Value |
|---|---|
| Height | **54px** |
| Background / border / radius | `--surface` / 1px `--border` / **8px** |
| Padding | `0 14px` |
| Tabs | Overview (active), Members, Loans |
| Tab | **154 × 44**, radius **6px**, **12.8px** label, one 20px chart icon |
| Active tab | `--primary`, white text, weight 600 |
| Inactive tab | transparent, `--text-strong` (`#111827`), weight 500 |
| Gap between tabs | **6px** |

The tab card spans the content width: **1582px** at 1837, **1024.7px** at 1280. Its top edge is
**86px**. Members and Loans replace the KPI/chart area with their empty-state panels; the tab card
itself does not change height.

### 5.2 KPI row

**Eight cards, always 4 per row**, equal width: **386.5px** at 1837, **247.2px** at 1280. Height
**94.8px**; horizontal gap **12px**; vertical gap **12px**. Each card: `--surface`, 1px
`--border`, radius **8px**, padding **14px**.

- Label top-left: **12.8px**, weight 500, `--text-muted`; may wrap to two lines.
- Badge top-right: **34px** circle, tinted background, 1px accent ring, **16px** icon.
- Value bottom-left: **12.8px**, weight 700, `--text-strong`.

| # | Label | Value (demo) | Icon | Accent / tint |
|---|---|---|---|---|
| 1 | Total Members | 1,111 | users | `--primary` / `--primary-tint` |
| 2 | Outstanding Loan Principal | TZS 93,715,396 | wallet | `--danger` / `--danger-bg` |
| 3 | Principal in Arrears | TZS 16,180,416 | warning triangle | `--accent-yellow` / `--accent-yellow-bg` |
| 4 | Clients in Arrears | 23 | user-minus | `--danger` / `--danger-bg` |
| 5 | Portfolio at Risk | 17.3% | shield-alert | `--danger` / `--danger-bg` |
| 6 | Savings & Shares Balance | TZS 41,208,900 | piggy-bank | `--primary` / `--primary-tint` |
| 7 | Till Status | Open | vault | `--primary` / `--primary-tint` |
| 8 | Unposted Transactions | 3 | receipt | `--accent-yellow` / `--accent-yellow-bg` |

Values are live demo data, not fixtures in the component. The unposted KPI must equal the count in
the banner ("3 transactions are waiting to be posted").

### 5.3 Chart card

`--surface`, 1px `--border`, radius **8px**, padding **30px**.

- Title "Funds In vs Funds Out": **12.8px**, weight 700, `--text-strong`.
- Subtitle "October 2026 · TZS": **12.8px**, `--text-muted`.
- Net pill: tinted `--primary-tint`, teal text, eg "Net in 9.3M".
- Two bars, **77px** wide at both measured widths, **square corners**: funds-in `--primary`,
  funds-out `--chart-out` (`#c75a43`). Heights are proportional to the data.
- Value label above each bar, eg "47.5M": **12.8px**, weight 500, `--text-strong`.
- Y axis: labels "TZS 50M … TZS 15M" in **5M steps**, **12.8px**, `--text-axis`.
- Gridlines: horizontal only, 1px `--grid-line`. No vertical gridlines.
- Tooltip on hover **and** keyboard focus: "Funds in: TZS …" / "Funds out: TZS …", closes on blur
  or pointer leave.

At 1837 the chart is **949.4 × 500.4** and sits beside the portfolio card (**612.6 × 500.4**,
20px gap). At 1280 it is **1024.7 × 500.4** and the portfolio stacks below it, full width and
326.8px high.

### 5.4 Portfolio composition

`--surface`, 1px `--border`, radius **8px**, padding **30px**.

- Title "Portfolio composition": **12.8px**, weight 700.
- Subtitle "Share of the branch portfolio": **12.8px**, `--text-muted`.
- One 20px stacked bar, square ends, four segments in order: loan principal `--primary`,
  savings `--brand-tenant-blue`, shares `--brand-logo-teal`, cash & bank `--accent-yellow`.
- Rows: Loan principal, Savings, Shares, Cash & bank — each TZS amount and percentage, **12.8px**.
- Total row: "Total portfolio" + TZS amount, **12.8px**, weight 700.

### 5.5 Floating elements

- Chat button: bottom-right, **60px** circle, background `--primary-fab`, white outlined
  chat-bubble icon (**22px**), soft shadow. Right inset **20px**, bottom inset **16px**.
  It is draggable by its 24px six-dot handle; double-click resets the corner position.
- Opening the chat dialog moves focus into it; Escape closes it and returns focus to the FAB.
- Ignore the dark vertical toolbar (`#1c1c1c`) at the right edge and the browser scrollbar. They
  are screen-recorder and browser overlays, not part of the application.

---

## 6. Rules

1. Tokens only. **No new colours, no near-matches.** Component padding and gaps use the spacing
   scale; the dashboard composition's 20px card gap and 30px chart padding are measured values.
2. Every rendered text node is **12.8px**. No 10px helper text, no 18px section titles, no 30px
   KPI values.
3. Cards: white, 1px `--border`, **8px** radius, **no heavy shadow**. Controls use 5px radius;
   pills use 6px; modals use 11px.
4. `--primary` is the only primary-action and active-state colour. Red marks money-out and risk;
   yellow marks warnings.
5. **KPI cards stay 4 per row at 1837 and 1280**; do not reflow to 2. The chart and portfolio are
   side by side at wide widths and stack below 1500px. Bars stay 77px. There is no horizontal
   scrollbar at either width.
6. No layout shift. Fonts load before the page is measured; the logo reserves its 28px height.
7. Every page implements loading, empty, error and forbidden states. Hiding a forbidden action in
   the UI is not a control; the API must also return 403.
8. Every sidebar destination resolves (`D-027`). An unbuilt module renders the shared `ComingSoon`
   page; it is never a dead link.

---

## 7. AIMSCAMS substitutions

The reference is another company's product. Measurements, colours, spacing and component anatomy
are adopted; **identity is ours** (`D-013`, `D-020`).

| Reference text / mark | AIMSCAMS value |
|---|---|
| Sidebar wordmark "WAKANDI" | **AIMSCAMS** — same position, size, weight and `--brand-logo-teal` colour |
| Footer "© 2026 Wakandi. All rights reserved." | **© 2026 AIMSCAMS. All rights reserved.** |
| Tenant "MFSL MFI" / "101457" | **AIMSCAMS Demo SACCO** / **TCDC SACCOS · AIM-DEMO** (synthetic) |
| Branch "MFSL MWANZA" | **Mwanza Branch** (synthetic) |
| User "Ally Juma Ally" / "AA" | **Amina Hassan Mwinyi** / **AM** (synthetic) |
| Tenant header mark | Mafanikio lockup in the demo; `organisation.logoUrl` in production |

No real member data, no observed tenant's staff names, no observed tenant's branding in shipped
UI. Demo data is generated, never copied (`D-014`).

---

## 8. Verification checklist

Before reporting any UI work as done, run the browser gate and record the measurements:

```powershell
cd tools/ui-audit
npm run login    # once per session; needs AUDIT_EMAIL, AUDIT_PASSWORD, AUDIT_MFA_SECRET
npm run audit    # AUDIT_URL defaults to http://localhost:3000/dashboard
```

`audit.mjs` runs shell checks on any authenticated route and dashboard checks only on
`/dashboard`. It saves screenshots and `report.json` under `artifacts/ui/audit/` (gitignored), and
exits non-zero on any failed check.

- [ ] Header: 68px, white, 1px `#dee2e6` border + `#c3c6ca` shadow, 14px padding, no duplicate
      user block.
- [ ] Tenant logo: image, 28px tall, ≤190px wide, `object-contain`, x=14; 40px monogram fallback.
- [ ] Institution name 12.8/600 `#495057`; detail 12.8/400 `#6c757d`.
- [ ] Flag 24×16; language 105.4×31.2; branch 119.6×32; avatar 34; user trigger 209.2×46.
- [ ] Sidebar 204 expanded / 76 collapsed; 12 items in the order above; pitch 40; rows 36
      (Settings 34); sub-items 28; icons 20 on x=28; labels 12.8.
- [ ] Active pill x=8→195.3, 36px tall, radius 6, `#057573`, white 600.
- [ ] Chevrons exactly on Accounts, Transactions, Accounting, Reports, Import; Settings group
      chevron; Campaigns "Soon" and still a link.
- [ ] Collapse control 44px, centred on the rail edge, 6px above the footer.
- [ ] Footer 73px, wordmark 12.8/700 `#479b92`, copyright two lines at 12.8 `#6c757d`.
- [ ] Tab card 54px, radius 8, padding 0 14; tabs 154×44, radius 6, 12.8; active teal, inactive
      `#111827` at weight 500; gap 6.
- [ ] Eight KPI cards, 4 per row at both widths, 94.8px tall, gap 12, padding 14, radius 8;
      labels 12.8/500 `#6c757d`, values 12.8/700 `#111827`, badges 34 with 16px icons.
- [ ] KPI values live; unposted KPI equals the banner count.
- [ ] Chart title/subtitle/axis/value labels at 12.8; two 77px square bars in `#057573` and
      `#c75a43`; 8 horizontal gridlines only; tooltip on hover and focus.
- [ ] Portfolio bar 20px with four correct colours; rows and total at 12.8.
- [ ] Chat 60px, `#037674`, right 20 / bottom 16, focus returns to the FAB.
- [ ] **Collapsed sidebar**: labels removed, icons on the same x=28 axis, active state visible,
      tooltip on hover/focus, no overflow.
- [ ] **Every dropdown and modal**: opens, closes on outside click and Escape, keyboard navigable,
      focus returns to the trigger; no clipping inside a scrolling container.
- [ ] Every page: loading, empty, error and forbidden states.
- [ ] All rendered text is 12.8px.
- [ ] Zero console errors, zero console warnings, zero unhandled page errors, zero failed
      same-origin requests, zero HTTP 5xx.
- [ ] No horizontal scrollbar at 1837×1080 or 1280×800.
- [ ] Production build (`npm run build && npm start`) renders identically.

Report the measured values, not an impression. "Looks right" is not evidence.
