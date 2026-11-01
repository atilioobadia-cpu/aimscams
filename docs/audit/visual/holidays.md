# Holiday calendar visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-policies-holidays\FULL.png`  
AIMSCAMS route: `/settings/policies/holidays`

## Comparison

The reference shows the shared policy tabs, working-day card, month/year calendar, and Add Holiday dialog states with name, date, recurring toggle, and add-another control. AIMSCAMS shows a working-day checklist and Save working days, followed by a No holidays yet empty card and Create holiday action. The month calendar, recurring entries, and multi-holiday dialog are not present in the local page. Working-day defaults currently mark Monday–Friday as open and Saturday/Sunday closed.

## Recommendations

- Add the shared policy tabs and month/year calendar with a holiday list or calendar entries.
- Support recurring and multi-entry holiday creation through a dedicated dialog.
- Keep date and working-day changes read-only until the calendar workflow is deliberately exercised.

Read-only browser review; no checkbox was changed and no save/create action was used. Implementation commit: none.
