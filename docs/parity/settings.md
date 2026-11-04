# Settings parity progress

## Branches

Compared the visible local Branches page with Wakandi `/settings/branch` using live computed layout values. Wakandi's title is a plain row (20.16px semibold) rather than a bordered title card. Its New Branch button measured 100 × 28.8px. The filter row's 191 × 34.1px search input starts at x=224.8, y=173.4; Add Filters starts at x=423.2, y=175 and is approximately 132px wide. The table begins at y=218.2; header cells are 37.5px tall and data rows 52.3px.

AIMSCAMS now uses the plain title row, compact 29px action button, matching search/filter widths and placement, and matching 37px/52px table dimensions. Local measurements after refresh: title x=263.3, y=99.2; search x=223.3, y=173.2; filter x=422.3, y=173.7; table y=219.3; header 37px; data row 52px. The local tenant currently has one branch while Wakandi displayed three; records were not copied.

## Other Settings references inspected

Wakandi Settings navigation exposes General, Accounting, Branches, Products, Policies, Auto Debit, Users, Roles, and Services. Their page content and controls were inspected read-only during the authenticated reference pass:

- General: Info, Security, and Appearance sections. Appearance exposes style, dark mode, accent color, and scale controls. No production settings were changed.
- Accounting: Inter Branch Setting, Financial Year, General settings, Manage categories, Cash/Bank Accounts, and Tax Rates.
- Branches: New Branch, filters, sortable columns, and row actions.
- Products: Loan Product, Savings Product, Interest Rate, Fee & Penalties, and Loan Provisioning.
- Policies: Membership Policy, Credit Product Policy, and Holidays.
- Auto Debit: rule filters and a rules table.
- Users and Roles: create controls, search/filter surfaces, row actions, and pagination where records exist.
- Services: the reference page exposed its heading but no stable body content during this pass.

The remaining subpages still need a per-page computed-style comparison and local verification. In particular, AIMSCAMS Accounting Settings has not yet been matched field by field with Wakandi's six tabs, and the Services body was not stable enough to measure. Do not treat the Settings navigation audit as complete until those comparisons and data-dependent row actions are verified.

## Local implementation status

- General now exposes the same Info, Security, and Appearance tab names. AIMSCAMS has no security-management endpoint, so its New Security control is visibly disabled rather than implying that it saves a record.
- Accounting now exposes Wakandi's six tab names and keeps existing local behavior under Inter Branch Setting, Financial Year, General Settings, and Tax Rates. Manage categories and Cash/Bank Accounts show an explicit local-API availability state because the corresponding operations are missing. This improves navigation parity, but their content and actions still need backend support and a fresh live comparison.
