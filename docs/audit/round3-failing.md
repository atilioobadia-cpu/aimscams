# Round 3 Clients parity baseline

## Live reference evidence

- Reference inspected read-only in the active Chrome session at `https://cams.wakandi.co.tz/clients`.
- Direct Wakandi DevTools shell measurements available from this live session: header `64.67 CSS px`; sidebar `200 CSS px`; standard nav item `175.9 × 29.4 CSS px`; nav label `13.44 CSS px`.
- The Round 3 reference capture scale is calibrated to approximately `1.5 screenshot px per CSS px`: sidebar `298 / 200 = 1.49`, active pill `45 / 29.4 = 1.53`, header `95 / 64.67 = 1.47`.
- The live Clients accessibility tree contains 12 headers: Member Id, Full Name, Reference Number, National Id, Type, Phone Number, Email Address, Status, KYC Status, DOJ, Group Name, Actions. This is more than the seven data columns listed in the Round 3 prompt; the spec preserves the live page's extra columns.
- No real reference member values were copied into AIMSCAMS or this audit note.

## Playwright baseline

Command: `node tools/ui-audit/node_modules/playwright/cli.js test tests/e2e/clients-parity.spec.ts --grep "height matches the live header metric" --workers=1 --reporter=line`

Result: `1 failed`. The failure occurs in `beforeEach`: the ignored local storage state at `artifacts/storage-state.json` redirects `/clients` to `/login`, so the Clients heading is absent. No parity assertion ran. The other 37 checks are not evaluated in this baseline. A full run requires a fresh local AIMSCAMS authenticated storage state; no credentials or browser cookies were read or copied.

The header/sidebar values above are direct live DevTools evidence. Client-specific screenshot dimensions in the supplied checklist remain converted using the calibrated 1.5 ratio and will be verified against the live Clients page before pixel fixes.
