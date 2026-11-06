# Needs human decision

## P01-T04 Auto Debit — create/edit dialog (unmeasured)
- Wakandi `/settings/auto-debit` list is empty in the live session, so the create/edit dialog and row-action affordances cannot be measured live. AIMSCAMS implements them using verified Settings dialog patterns (Modal, Input, shared row actions) and records them here per M6.
- Rule filter popover, Add Filters overlay and column chooser are measured and matched.
- Question: provide a Wakandi session with at least one Auto Debit rule so the create/edit dialog can be measured and verified.

## P03-T01 Import — placeholder parity
- Wakandi `/import` is itself a placeholder ("Import functionality will be implemented here."). AIMSCAMS now matches it exactly.
- The earlier "3 import flows" note was incorrect. No human decision needed for parity; real import features remain future work outside the parity scope.
