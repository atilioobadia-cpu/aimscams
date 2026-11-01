# Current UI parity implementation plan

Status: Active. Implementation, visible-browser comparison, and verified repository delivery are underway at the user's direction.

The single authoritative phase sequence, domain guardrails, acceptance gate, and task checklist are maintained in [tasks/plan.md](../../tasks/plan.md) and [tasks/todo.md](../../tasks/todo.md). This file is the visual-audit entry point; it does not define a second phase order.

## Current execution sequence

1. Keep the route map, reference IDs, rendered titles, visual index, per-page notes, and queue synchronized.
2. Calibrate screenshots against `docs/11-ui-contract.md`; compare matching states at recorded viewports and mask dynamic text for structural comparisons.
3. Fix measured shared shell and component differences before page-specific work.
4. For each page, inspect its matching Wakandi capture and the authenticated local page in the visible in-app browser; record findings in that page's Markdown note.
5. Implement supported behavior through the existing domain/API path. Add deterministic invented sample records only in local/test environments and only after checking seed and domain contracts.
6. Verify the page and touched shared patterns in the browser, run the relevant build/checks, synchronize audit records, then commit and push the verified batch.
7. Continue through every mapped reference and finish with full-system regression; keep unresolved product/data decisions explicit.

## Guardrails

- Wakandi screenshots are read-only visual references. Preserve AIMSCAMS identity and current project decisions.
- Never copy reference identities or financial values into fixtures, and never seed production.
- Do not expose a UI action unless it has truthful supported behavior; keep permission, audit, ledger, validation, and idempotency rules intact.
- A route slug returning 404 is a naming question until the route tree, navigation, title, and content establish whether a local route is missing.