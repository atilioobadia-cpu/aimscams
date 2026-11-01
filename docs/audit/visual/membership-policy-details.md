# Membership policy details visual audit

Date: 2026-11-01  
References: `F:\Wakandi\settings-policies-membership-policy-1\FULL.png`, `...membership-policy-2\FULL.png`  
AIMSCAMS route: `/settings/policies/membership/[id]`

## Comparison

The references show Individual and Group membership policy detail states. Both use a summary header with status/name/member type and Back/Edit actions, then Next of Kin and Member Dormancy, Member Activation, an approval-status timeline, board-member selection, and an approval list. AIMSCAMS renders this structure for both synthetic `VISUAL-QA-MEM` Individual and `VISUAL-QA-GRP` Group drafts. The local membership model does not provide an approval timeline, board assignment, or approval rows; those areas show an explicit unavailable state.

## Recommendations

- Add persisted approval history and board assignments before enabling approval controls.
- Preserve the shared detail layout for both member types; Group Settings belong to create/edit as in the reference.

Read-only browser review at 1280×720 for both member types; detail page/body widths were 1280px with no horizontal overflow. Neither draft was edited or approved.
