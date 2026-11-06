# Needs human decision

## P01-T04 Auto Debit — create/edit dialog (unmeasured)
- Wakandi `/settings/auto-debit` list is empty in the live session, so the create/edit dialog and row-action affordances cannot be measured live. AIMSCAMS implements them using verified Settings dialog patterns (Modal, Input, shared row actions) and records them here per M6.
- Rule filter popover, Add Filters overlay and column chooser are measured and matched.
- Question: provide a Wakandi session with at least one Auto Debit rule so the create/edit dialog can be measured and verified.

## P03-T01 Import — missing feature
- Wakandi route: `/import` — 3 flows (Member, Account, Transaction) with multi-step wizards, column mapping, validation, dry-run preview, result states.
- AIMSCAMS: "Coming Soon" placeholder only.
- Per M6, requires real local UI + backend + model + synthetic seed. Not a toast-only placeholder.
- Question: scope as separate feature task or inline parity task? Priority vs other phases?
