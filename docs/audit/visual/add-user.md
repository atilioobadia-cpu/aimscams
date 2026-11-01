# Add User visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-administrator-add\FULL.png`  
AIMSCAMS route: `/settings-administrator-add`

## Comparison and implementation

The reference uses a full-page New User title card, an accordion form for User Details, Roles, Branch Access, WBA Access, and Teller, and a bottom Cancel/Save action row. AIMSCAMS now renders `/settings-administrator-add` as a full-page form instead of redirecting to a create-user modal. The New User action from the user list opens this route. User details, role assignment, and branch selection remain connected to the existing validated create/update API.

## Browser evidence

- Opened the canonical add route in the visible browser and inspected all five accordion sections without entering data or submitting the form.
- Checked the expanded Role and Branch Access sections. Existing role choices and organization branch data loaded. At 1280×720 the document width remained 1280px with no horizontal overflow; all section headers and action buttons fit the page.
- The local user model has no WBA or teller-access properties. Those reference sections are present, but explain that the capability is unavailable; the Teller checkbox is disabled. No unsupported access setting is saved as if it worked.
- No account was created or edited. The form stayed empty.

## Remaining work

- Add WBA and Teller access only after their permission and persistence contracts are defined and supported by the API.
- Populate more user states only through an isolated local/test fixture path, never by copying reference identities or contact data.
- Run final regression with the Users list and account-creation routes.

The web production build passed. No form was submitted and no user record was changed.
