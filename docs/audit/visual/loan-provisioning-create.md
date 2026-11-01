# Loan provisioning rule creation visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-products-loan-provisioning-create\FULL.png`  
AIMSCAMS route: `/settings/products/provisioning-rules/new`

## Comparison and implementation

Added the missing full-page `/settings/products/provisioning-rules/new` route and changed the Loan Provisioning Add new action to open it. The form follows the reference title, provisioning-name card, criteria row, and bottom Save/Cancel actions. Minimum days, maximum days, and percentage map to the existing `daysFrom`, `daysTo`, and `rateBp` fields. The current API also requires a local code and supports status, description, and one ledger account ID; these AIMSCAMS fields remain visible and save through the existing create endpoint.

The model has no category field, multiple criteria rows, or separate liability, expense, and income accounts. Those reference controls are shown disabled with an explanation. I401 tracks the remaining data-contract gap.

## Browser review

Opened the new route in the visible browser at 1280×720. The full page has no document/body horizontal overflow; criteria headers wrap to fit the local viewport, and the lower GL account area and Save/Cancel actions are reachable by vertical scrolling. No values were entered and no provisioning rule was created.

Web production build passed. Implementation commit: pending.
