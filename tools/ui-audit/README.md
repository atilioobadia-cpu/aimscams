# ui-audit

Measures the rendered shell against `docs/11-ui-contract.md` in a real browser and
fails on console errors. Skeleton until the shell exists in Phase 1.

```powershell
cd tools/ui-audit
npm install
$env:AUDIT_URL="http://localhost:3000/dashboard"; npm run audit
```

Outputs `artifacts/ui-audit.png` and a JSON report. Measurement targets are
`data-testid="app-header"` and `data-testid="app-sidebar"`, which the shell must expose.
