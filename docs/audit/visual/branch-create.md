# Branch creation visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-branch-add\FULL.png`  
AIMSCAMS route: `/settings/branches/new`

## Comparison

Both pages use a full-page form with branch details, location, and weekly opening hours. AIMSCAMS has a strong structural match in the shared sections and includes the default-branch option. The reference places Branch Name and Branch Code side by side, uses a wide address field, employee count, region/district/ward selectors, an opening-hours schedule with open/closed toggles, and a Special Dates & Holidays area. AIMSCAMS uses text inputs for region/district/ward, a council-type selector, a different editable weekly grid, and has no holiday-exception section. The local heading includes breadcrumbs and instructional copy absent from the reference capture.

## Recommendations

- Match the reference field grouping and schedule controls while preserving AIMSCAMS validation and branch rules.
- Add the special-date override workflow only with a defined data model and safe persistence behavior.
- Review full-page scrolling and footer actions so Save remains reachable without overlaying the schedule.

Read-only browser review; no fields changed and Create branch was not activated. Implementation commit: none.
