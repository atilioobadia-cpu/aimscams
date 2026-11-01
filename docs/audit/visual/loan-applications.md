# Loan applications list visual audit

## Evidence

- Reference: `F:\Wakandi\account-loan-application\FULL.png` (2240 × 934 pixels). The screenshot includes an open support-chat overlay that obscures part of the right side; covered regions are not scored.
- AIMSCAMS: `/account-loan-application`, inspected in the visible browser at 1470 × 1094 CSS px (DPR 1.0).
- The local API returns no loan applications. No reference names or records were copied, and no local records were seeded or changed.

The reference screenshot is displayed scaled in the audit viewer. Shell geometry is consistent with the 76px header and 240px expanded rail measured on the other list references. The local viewport is narrower than the reference capture, so content widths are not directly compared.

## Measured local structure

| Element | AIMSCAMS after change |
|---|---:|
| Header / expanded sidebar | 76px / 240px |
| Title card | x=256, y=94, 1198×84px |
| Status tabs | x=256, y=196, 1198×55px |
| Toolbar card | x≈277, y≈270, 1157×67px |
| Search / Loan officer / Status | 240 / 130 / 130px wide, 42px high |
| Table header | y≈336, h≈44px |
| Table content / viewport | 1515px / 1157px, horizontally scrollable |

The reference shows a title card with a New loan application action, Pending / Approved / All tabs, Search and Loan officer controls, a Status filter, filter actions, then a table with member, product, loan officer, stage, status, tenure, date, amount and row actions. AIMSCAMS now follows that structure and keeps its existing create and details routes.

## Controls exercised

- Pending, Approved, and All tabs change the visible status group; arrow-key navigation moves between tabs.
- Loan officer selection uses the existing AIMSCAMS loan-officer endpoint.
- Status is the default selected filter field, shown with a remove control and the “1 added” count. Optional Product and Tenure filters can be added from the filter menu.
- Status and Product filters narrow the local result set; a nonmatching product shows the empty state.
- Clear filters resets filter values and restores the reference default: the Pending tab with the Status field selected.
- Save current filters displays that persistent saved-filter storage is not configured.
- Browser console errors and warnings: none after the update.

## Remaining differences and blockers

1. The reference has two application rows; AIMSCAMS currently has none. Row density, status badges, names, amounts, and row-menu behavior cannot be compared against local data.
2. The reference shows a workflow Stage such as a document-review assignment. AIMSCAMS’ application response has no workflow-stage field; the table displays an em dash and the missing workflow is recorded in `NEEDS-HUMAN.md`.
3. Saved-filter persistence and the exact choices in the reference Add filters menu are not visible in the supplied capture and are not implemented locally.
4. The screenshot’s support-chat panel covers the far-right reference region. Page-specific hover and focus colors are also unscored.

## Status

The title/action, status tabs, filter toolbar, table columns, horizontal scroll and empty-state structure have been aligned and measured. Workflow-stage data, saved-filter persistence and representative local rows remain open.
