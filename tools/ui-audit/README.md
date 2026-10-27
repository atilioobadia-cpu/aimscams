# ui-audit

Measures the rendered back office against `docs/11-ui-contract.md` in a real browser. Shell
geometry, typography, overflow and console checks run on **any authenticated route**; dashboard
content checks run only when `AUDIT_URL` ends in `/dashboard`. It runs at **1837×1080** and
**1280×800**, expanded and collapsed, and exits non-zero on any failed check.

## Run

Start the web app. Use the production build when you are claiming production parity; dev is fine
while iterating.

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH="F:\DevCache\ms-playwright"
npm run build -w @aimscams/web
npm run start -w @aimscams/web
```

Then create the authenticated storage state once per session:

```powershell
cd tools/ui-audit
npm install
$env:AUDIT_EMAIL="admin@aimscams.local"
$env:AUDIT_PASSWORD="..."
$env:AUDIT_MFA_SECRET="..."   # base32; only needed when MFA is challenged
npm run login
```

`login.mjs` performs the real password + TOTP flow, waits for hydration on a cold start, retries
once across the TOTP boundary, and writes `<repo>/artifacts/storage-state.json`.

Run the audit against the dashboard or any other authenticated route:

```powershell
npm run audit
$env:AUDIT_URL="http://localhost:3000/accounting-entries"; npm run audit
```

Optional environment:

| Variable | Default |
|---|---|
| `AUDIT_URL` | `http://localhost:3000/dashboard` |
| `AUDIT_BASE_URL` | `http://localhost:3000` (login) |
| `AUDIT_STORAGE_STATE` | `<repo>/artifacts/storage-state.json` |
| `AUDIT_HEADLESS` | `true` (set `false` to watch the login) |

## Output

Screenshots and `report.json` go to `<repo>/artifacts/ui/audit/`; login failures write
`<repo>/artifacts/login-failure.png`. The root `artifacts/` directory is git-ignored.

The report lists every check and its measured value. A failure prints the check name, the expected
value and what was measured.

## What it asserts

- Header 68, sidebar 204/76, active pill 187.3×36 at radius 6, 12 items in order, icon axis 28,
  footer 73, collapse control 44 on the rail edge.
- Tab card 54 with 154×44 tabs, eight KPI cards fixed at four per row, chart and portfolio geometry,
  60px chat button.
- Every rendered text node is 12.8px; no horizontal overflow at either viewport.
- Language dropdown, sheet, support dialog and chart tooltip: open, close on Escape and outside
  click, focus return, keyboard operation.
- Collapsed sidebar keeps the icon axis, active state and accessible names.
- Zero console errors, zero console warnings, zero page errors, zero failed same-origin requests,
  zero HTTP 5xx.

Test hooks are the `data-testid` attributes exposed by the shell, dashboard cards, chart and
dialogs. Keep those hooks stable while the layout is under audit.

## Adding a route

`AUDIT_URL` is enough for shell checks. Route-specific content assertions belong in
`audit.mjs`, guarded by the pathname so the dashboard suite does not run against another page.
Add the route to the phase gate once it passes at both viewports.
