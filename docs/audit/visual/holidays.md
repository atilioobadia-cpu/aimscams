# Holiday calendar visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-policies-holidays\FULL.png`  
AIMSCAMS route: `/settings/policies/holidays`

## Comparison

The reference shows the shared policy tabs, working-day card, month/year calendar, and Add Holiday dialog with name, date, recurring toggle, and add-another control. AIMSCAMS now includes the shared tabs and a six-week month grid with month/year selectors and previous/next controls. Existing holiday records render on their date. The Add Holiday dialog matches the reference field layout; recurring and Add Another Holiday controls are disabled because the current endpoint stores one date/name at a time and has no recurrence field. Working-day defaults currently mark Monday–Friday as open and Saturday/Sunday closed; the local Save working days action still does not persist.

## Recommendations

- Extend the holiday contract to save recurring and multi-entry holidays.
- Persist branch working-day settings instead of showing a success action without a save endpoint.

Visible browser review at 1280×720 confirmed the Holidays tab, month grid, and date navigation. Document/body widths were both 1280px. Opened and canceled the Add Holiday dialog without entering values; no checkbox was changed and no save/create action was used. The remaining recurrence, multi-entry, and working-day persistence gaps are tracked in I391. Web production build passed. Implementation commit: pending.
