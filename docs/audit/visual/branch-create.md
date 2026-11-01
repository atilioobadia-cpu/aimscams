# Branch creation visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-branch-add\FULL.png`  
AIMSCAMS route: `/settings/branches/new`

## Comparison

The visible local form now uses the reference-style Add Branch title card with an outlined Back to branches action, a Details section heading, side-by-side branch name/code fields, and a multiline address field. At 1280×720 the document/body widths are both 1280px. The complete form is 1858px tall and scrolling reaches the bottom Create/Cancel controls without a fixed footer covering content.

Remaining differences: AIMSCAMS has extra Status and council-type controls, employee count is in the location section, region/district/ward are free-text fields instead of the reference selectors, and the weekly schedule uses checkboxes/time inputs rather than reference status toggles. The reference also includes a Special Dates & Holidays area with per-date closed/open hours; the local branch model stores weekly hours only. Existing branch validation and API payload remain connected.

## Recommendations

- Add governed region/district/ward catalogs and dependent selectors to the branch data contract.
- Define and persist branch-specific date overrides, including open/closed and optional hours, before adding the Special Dates workflow.
- Refine the weekly closed/open controls and field order while preserving existing validation and branch rules.

No fields were entered and Create branch was not activated. Web production build passed. Implementation commit: pending.
