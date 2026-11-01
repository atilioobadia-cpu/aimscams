# Membership policy edit visual audit

Date: 2026-11-01  
References: `F:\Wakandi\settings-policies-membership-policy-1-edit\FULL.png`, `...membership-policy-2-edit\FULL.png`  
AIMSCAMS route: `/settings/policies/membership/[id]/edit`

## Comparison

The references show long edit forms for Individual and Group membership types. Shared sections include Basic Details, Next of Kin, Member Dormancy, Allow Minors, Mandatory Savings, Mandatory Shares, Membership Policy Fees, Member Activation, and Mandatory Credit Products; Group policies also expose member/signatory limits and multiple-group behavior. AIMSCAMS edit route loads the synthetic `VISUAL-QA-MEM` Individual draft with the saved supported values and the same section hierarchy as create. Fields absent from the local contract remain disabled, and the Group-specific populated edit state is not yet available.

## Recommendations

- Provide a populated edit route reusing the complete type-aware create form and its section hierarchy.
- Preserve approval-state restrictions and existing values while editing; review only with synthetic records.

Read-only browser review; the synthetic draft loaded in the edit form and no field was changed or saved. No edit-form code changes were needed.
