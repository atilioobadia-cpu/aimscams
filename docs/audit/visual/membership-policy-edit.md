# Membership policy edit visual audit

Date: 2026-11-01  
References: `F:\Wakandi\settings-policies-membership-policy-1-edit\FULL.png`, `...membership-policy-2-edit\FULL.png`  
AIMSCAMS route: `/settings/policies/membership/[id]/edit`

## Comparison

The references show long edit forms for Individual and Group membership types. Shared sections include Basic Details, Next of Kin, Member Dormancy, Allow Minors, Mandatory Savings, Mandatory Shares, Membership Policy Fees, Member Activation, and Mandatory Credit Products; Group policies also expose Group Settings for member/signatory limits and multiple-group behavior. AIMSCAMS edit route loads both synthetic `VISUAL-QA-MEM` Individual and `VISUAL-QA-GRP` Group drafts with the saved supported values. The Group edit now displays the reference Group Settings section with its unsupported controls disabled. Other fields absent from the local contract remain disabled.

## Recommendations

- Provide a populated edit route reusing the complete type-aware create form and its section hierarchy.
- Preserve approval-state restrictions and existing values while editing; review only with synthetic records.

Read-only browser review; the Individual and Group synthetic drafts loaded in the edit form, and no fields were changed or saved. Group Settings layout was added; its values remain unsupported by the local contract.
