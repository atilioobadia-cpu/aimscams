# @aimscams/web

Next.js application for all AIMSCAMS screens. Visual values come from
[`docs/11-ui-contract.md`](../../docs/11-ui-contract.md); do not hard-code colours in components.

```powershell
npm run dev:web      # from the repository root, http://localhost:3000
npm run build -w @aimscams/web
```

The API boundary is `@aimscams/api`: the web app reads, the API writes.
