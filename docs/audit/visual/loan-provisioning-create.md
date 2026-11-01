# Loan provisioning rule creation visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-products-loan-provisioning-create\FULL.png`  
AIMSCAMS route: `/settings/products/provisioning-rules/new`

## Comparison

The reference form shows a Loan Provisioning Criteria heading, full-width Provisioning Name field, Active checkbox, a multi-row criteria table (Category, Min Days, Max Days, Percentage, Liability Account, Expenses Account, Income Account, Actions), and Save/Cancel actions.

The AIMSCAMS create page now keeps that same first-view structure. The reference-style required-name error is visible when the name is empty; the status dropdown maps to an Active checkbox. Code, description, and the local single GL Account ID remain available inside a collapsed AIMSCAMS-specific fields section so they do not interrupt the reference flow.

The local schema cannot store category, multiple criteria rows, or distinct liability/expense/income accounts. Those criteria controls and Add Category are disabled, and Save cannot submit a partial provisioning rule. The unsupported fields are tracked in I401. No policy was created or changed.

## Browser review

Opened the route in the visible in-app browser and compared it with the supplied full-page reference. The first-view title, name/error state, Active checkbox, criteria table, unavailable Save action, and Cancel action are aligned. The narrow in-app viewport horizontally scrolls the wide criteria table as expected; a canonical full-width screenshot diff remains outstanding.

The prior screenshot report used the list route rather than the creation route. Its metrics are stale and must not be used as the create-form score. Web production build verification is recorded in the audit progress entry.
