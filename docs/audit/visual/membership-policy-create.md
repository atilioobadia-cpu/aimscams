# Create membership policy visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-policies-membership-policy-create\FULL.png`  
AIMSCAMS route: `/settings/policies/membership/new`

## Comparison and implementation

Reorganized the form into Basic Details, Next of Kin, Member Dormancy, Allow Minors, Mandatory Savings, Mandatory Shares, Membership Policy Fees, Member Activation, and Mandatory Credit Products. Matched the two-column supported fields, section separators, and bottom actions. Name, member type, description, next-of-kin bounds, dormant days, withdraw/auto-activation flags, verification and code/status remain connected to the existing create/edit payload; existing defaults were preserved.

The current policy contract cannot save minor eligibility, Group Settings, mandatory savings/shares, membership fees, auto-debit/migrated-member behavior, deactivate/exit, or credit-product mappings. These reference controls are present but disabled with short explanations. Group Settings appear only for Group member types. I390 remains open for the missing fields and workflows.

## Browser review

Compared `/settings/policies/membership/new` with `F:\Wakandi\settings-policies-membership-policy-create\FULL.png` in the visible browser at 1280×720. The form scrolls vertically to the configuration and Submit/Cancel footer; document and body widths are both 1280px. Afterwards, created clearly labeled `VISUAL-QA-MEM` (Individual) and `VISUAL-QA-GRP` (Group) drafts with ordinary defaults and synthetic-only descriptions to review the related list, detail, and edit routes. Unsupported policy settings remain disabled.

Web production build passed. Create-form implementation commit: `1746efb`.
