# Stack and run guide (Phase 0)

Recorded 2026-10-29 from the repo at commit `8b8ff57` (tag `v1.1.0`).

## Stack

| Layer | Technology | Where |
|---|---|---|
| Monorepo | npm workspaces | `package.json` |
| Web | Next.js 16.4.3 (App Router, Turbopack), React 19.3, TypeScript 6 | `apps/web` |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`), tw-animate-css, shadcn/ui on Radix | `apps/web/src/app/globals.css`, `apps/web/src/components/ui` |
| Icons | lucide-react | throughout |
| API | NestJS (`nest build`, `dist/main.js`) | `apps/api` |
| Worker | BullMQ outbox consumer | `apps/worker` |
| Database | PostgreSQL 16, Prisma 7 | `packages/db`, schema under `packages/db` |
| Ledger invariants | SQL in `packages/ledger/src/schema.sql` (append-only, period guard, RLS) | `packages/ledger` |
| Shared contracts | Zod | `packages/contracts` |
| Domain | money (integer minor units), schedules, allocation | `packages/domain` |
| Auth | application auth, TOTP MFA (authenticator only), not Keycloak | `apps/api` |
| Tests | Vitest (api, worker, domain, ledger, contracts); PGlite for ledger | per workspace |
| Browser audit | Playwright script, `tools/ui-audit/audit.mjs` | `tools/ui-audit` |
| Deploy | one Linux OCI image with web/api/worker commands | `deploy/`, `Dockerfile`, `.github/workflows/ci.yml` |

Design rules that shape the audit (from `AGENTS.md`):

- Money is integer minor units, serialised as strings.
- The ledger is append-only. Corrections are reversing entries.
- The API is the only writer. Next.js reads.
- Status-bearing records are inactivated, never deleted.
- UI rules live in `docs/11-ui-contract.md`.

## Local run

Servers already running on this machine:

| Service | URL / port | Start command |
|---|---|---|
| Postgres | `127.0.0.1:5433`, db `aimscams_dev` | `postgres.exe -D C:\Users\atili\pgdata-aimscams -p 5433` (do not use `pg_ctl`; it crashes with 0xC0000142 here) |
| API | `http://localhost:4000` (health `/health` returns 200) | `node dist/main.js` in `apps/api` after `npm run build -w @aimscams/api` |
| Web | `http://localhost:3000` (`/login` returns 200) | `node node_modules/next/dist/bin/next start --port 3000` in `apps/web` after a build |

Rebuild before testing: `npm run build -w @aimscams/web` then restart the web server. The API runs from `dist`.

Database connection string is in `.env` (`DATABASE_URL`, local only). Not reproduced here.

## Tests and gates

```powershell
npm run typecheck                 # all workspaces
npm test                          # all workspaces (140 tests at v1.1.0)
npm run build -w @aimscams/web    # production build
cd tools/ui-audit; $env:AUDIT_URL="http://localhost:3000/<route>"; npm run audit
```

Last measured at `8b8ff57`: typecheck clean, 140 tests passing, audit 348/348 on `/dashboard`.

## Login for browser checks

- Admin: `admin@aimscams.local`. Password and TOTP secret are kept out of the repo. The audit reads `artifacts/storage-state.json`, which exists and works.
- Playwright and Chromium run; the audit already loads the app at both widths.

## Environment

- Windows, PowerShell. No `&&` chaining; use `Select-String` and separate commands.
- Python 3.12 with Pillow 12.3 and numpy 2.5 present. **No OCR engine installed yet** (no tesseract binary, no pytesseract, no easyocr). Phase 2 must install one.
- `psql` is not on PATH. Backups will use `pg_dump` from the Postgres install, or a Node script through Prisma; confirm before Phase 5.
- Reference screenshots: `F:\Wakandi` holds about 430 PNG files, one PDF and an xlsx template. Logos in `F:\Wakandi\mafanikio_logo\` (`mfsl_logo.jpg`, `mfsl_logo-removebg-preview.png`, `mafanikio-logo.png`).
- Package caches are on `F:\DevCache`, so `npm` and `npx` are slower than on `C:`.

## Open items found in Phase 0

1. OCR tooling missing (Phase 2 blocker until installed).
2. `artifacts/storage-state.json` is the only login artefact. Keep it out of commits.
3. A GitHub token was pasted into a shell command in the previous session (release creation for `v1.1.0`). It is in the session transcript. Revoke it and create a new one, and do not paste tokens into commands again.
