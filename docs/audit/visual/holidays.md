# Holiday calendar visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-policies-holidays\FULL.png`  
AIMSCAMS route: `/settings/policies/holidays`

## Comparison

The reference shows the shared policy tabs, working-day card, month/year calendar, and Add Holiday dialog states with name, date, recurring toggle, and add-another control. AIMSCAMS now includes the shared Membership Policy / Credit Product Policy / Holidays tab row above its existing working-day checklist and holiday list. The month calendar, recurring entries, and multi-holiday dialog are still not present. Working-day defaults currently mark Monday–Friday as open and Saturday/Sunday closed.

## Recommendations

- Add the shared policy tabs and month/year calendar with a holiday list or calendar entries.
- Support recurring and multi-entry holiday creation through a dedicated dialog.
- Keep date and working-day changes read-only until the calendar workflow is deliberately exercised.

Visible browser review at 1280×720 confirmed the Holidays tab is active and the document width is 1280px. No checkbox was changed and no save/create action was used. The remaining calendar workflows are tracked in I391. Implementation commit: pending.
