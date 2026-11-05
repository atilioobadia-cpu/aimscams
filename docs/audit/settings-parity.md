# Settings UI parity audit

Reference: authenticated Wakandi Settings pages in the visible Chrome session. Production was inspected read-only. No production records or settings were changed, and the local comparison used existing AIMSCAMS data only.

## Shared reference styling measured in DevTools

- Root font: Roboto, `13.44px`.
- Primary color: `#057573`; page canvas: `#ebe9e9`.
- Sidebar: `200px`; header: approximately `65px` in the live session.
- The browser was inspected with DevTools docked, reducing the visible page height to about `259px`. Therefore this pass did not establish exact component heights for the full page viewport.

These are shared shell values. They do not establish exact pixel parity for individual controls, forms, and dialogs.

## Page-by-page findings

| Settings page | Wakandi reference | AIMSCAMS state and next work |
| --- | --- | --- |
| General | Info, Security, and Appearance tabs. Info includes institution details and Online Collections. | Local tab structure is present. Institution fields differ; Security creation is unavailable in the local API. Appearance controls are present. Keep the unavailable state explicit; do not imply that security records can be created. |
| Accounting | Six tabs: Inter Branch Setting, Financial Year, General settings, Manage categories, Cash/Bank Accounts, and Tax Rates. | Tabs are present. Financial Year is represented as local fiscal periods, while Wakandi presents labeled year rows. General Settings is a local posting-policy card instead of Wakandi’s decimal/tax settings table. Manage categories and Cash/Bank Accounts explicitly report missing local API support. Tax Rates is a single percentage setting locally versus a named/code/description/active table in Wakandi. These require domain/API alignment before visual-only treatment. |
| Branches | New Branch, search, Add Filters, and columns Branch Name, Status, Branch Code, Address, Region, District, Ward, and actions. | Local list has search/filter and region/district/ward controls but omits the Status column and orders Branch Code/Address immediately after the name. Local status values mean Open/Closed; do not relabel them Active/Inactive without a matching domain field. |
| Products | Loan Product, Savings Product, Interest Rate, Fee & Penalties, and Loan Provisioning tabs. | Same five labels/order and the loan-product core columns are present. Local list also shows Add Filters and a column control. Compare each tab’s forms and controls before claiming full parity. |
| Policies | Membership Policy, Credit Product Policy, and Holidays tabs. | Same three tabs and list structure are present, with local-only sample policy rows. Do not copy production policy data. A full control/field comparison for all three tabs remains pending. |
| Auto Debit | Auto Debit Rules page with Search, Rule filter, Add Filters, and a rules register. | AIMSCAMS currently renders an explicit “not enabled yet” state because its local settings model has no Auto Debit support. Building the register alone would be misleading; implement a real local model/API before enabling it. |
| Users | User Management, New User, Add Filters, table, and pagination. | Same page purpose and primary controls. Local has two local users while Wakandi’s record count is different; preserve local identity data and compare only columns/actions. |
| Roles | Role Management, New Role, Add Filters, table, and pagination. | Same page purpose and primary controls. Local role records are local. Exact column/action parity still needs a responsive Wakandi capture. |
| Services | Services title card. | Both visible pages show the same title-card-only surface in this session. |

## Verification and limits

- Compared live Wakandi and local AIMSCAMS using the visible Chrome tabs. Kept Wakandi read-only.
- Read the computed root style values from Wakandi DevTools. The Wakandi tab intermittently crashed while DevTools was attached, so repeated page captures and per-control computed measurements were not reliable.
- AIMSCAMS remained available and its current routes were confirmed under `/settings/*` and `/settings-*` paths.
- Exact page-level pixel parity is not claimed. Highest-priority implementation gaps are the accounting settings data model/API, Auto Debit model/API, and the missing Branch Status field with its correct semantics.
