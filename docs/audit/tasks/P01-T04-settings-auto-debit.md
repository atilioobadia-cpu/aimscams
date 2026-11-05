# P01-T04 — Settings › Auto Debit

State: `BLOCKED`

Reference: `https://cams.wakandi.co.tz/settings/auto-debit`
Local: `http://localhost:3000/settings-auto-debit` (returns 404 — route does not exist)

## Goal check (M9)

- Does this move the page to `VERIFIED_MATCH`? No — the feature is entirely missing (no route, no UI, no backend, no model, no seed).
- Anything outside the plan? No. This is recorded as an open question per M6.

## Blocker

Auto Debit is a full feature surface in Wakandi: a rules table (Rule, Name, Product/Charge Name, Source Product, Trigger Events, Priority, Requires Consent, Overridable, Status) with a "Rule" creation button, "Add Filters", and an empty state. AIMSCAMS has no corresponding route, component, API endpoint, or database model. Per M6, this requires real local UI + backend + model + synthetic seed data, not a toast-only placeholder.

## Open question (recorded in docs/audit/NEEDS-HUMAN.md)

- Should Auto Debit be scoped as a separate feature task (new phase) rather than a parity task? Building it inline would block the rest of Phase 1.
- What is the priority of Auto Debit relative to the other Settings pages?

## Next
Move to P01-T05 Policies; revisit Auto Debit after Phase 1 or per human decision.
