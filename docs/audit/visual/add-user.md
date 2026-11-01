# Add user visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-administrator-add\FULL.png`  
AIMSCAMS route: `/settings-administrator-add` (opens `?modal=create`)

## Comparison

The reference is a full-page New User form with accordion sections for User Details, Roles, Branch Access, WBA Access, and Teller. AIMSCAMS opens a centered modal over the user list with email, name, phone, branch, status, password, and a long two-column role checklist. The current dialog is scrollable and uses a second nested Add user title. The reference keeps Save disabled until required fields are complete and exposes its account-access sections in the page flow.

## Recommendations

- Replace the modal with a full-page form using the reference title card and accordion section hierarchy.
- Group branch, WBA, and teller access with role selection; retain local account-security fields in the appropriate section.
- Check dialog/page height, keyboard focus, and footer placement at desktop and shorter viewports.

Read-only browser review; fields were left empty and Create user was not activated. Implementation commit: none.
