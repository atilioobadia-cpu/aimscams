# ui-audit

Measures the rendered shell against `docs/11-ui-contract.md` in a real browser. It runs at
**1837×1080** and **1280×800**, in both expanded and collapsed sidebar states, and fails on
geometry regressions, broken interactions, console errors, failed requests, or horizontal
overflow.

## Run

Start the production web build first:

```powershell
npm run build -w @aimscams/web
npm run start -w @aimscams/web
```

Then, in another terminal:

```powershell
cd tools/ui-audit
npm install
$env:PLAYWRIGHT_BROWSERS_PATH="F:\DevCache\ms-playwright"
npm run audit
```

Set `AUDIT_URL` to point at a different host if needed.

## Output

The audit writes `artifacts/audit-report.json` plus screenshots for the expanded and collapsed
shell, both menus, the unposted sheet, the support dialog, and the Members tab. The `artifacts/`
directory is git-ignored.

The script exits non-zero if any check fails. It asserts:

- 97px header, 300px sidebar below it, 76px collapsed sidebar, 44px active nav pill at 8px radius.
- All 12 nav items in order, their chevrons, and Campaigns as a disabled “Soon” row.
- 104px tab card, 154×44 active tab, 4/2-column KPI grid, 66px badges, and chart geometry.
- Language selection, dropdown Escape/outside-click behaviour, focus return, sheet and dialog
  close behaviour, chart hover/focus tooltips, and tab keyboard activation.
- Collapsed icons on the same x=38 axis, preserved active state, accessible names, and tooltips.
- Zero console errors, zero 4xx/5xx responses, and no horizontal scroll.

Test hooks are the `data-testid` attributes exposed by the shell, dashboard cards, chart, and
dialogs. Page code should keep those hooks stable while the layout is under audit.
