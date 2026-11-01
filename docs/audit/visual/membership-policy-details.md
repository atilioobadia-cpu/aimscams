# Membership policy details visual audit

Date: 2026-11-01  
References: `F:\Wakandi\settings-policies-membership-policy-1\FULL.png`, `...membership-policy-2\FULL.png`  
AIMSCAMS route: `/settings/policies/membership/[id]`

## Comparison

The references show Individual and Group membership policy detail states. Both use a summary header with status/name/member type and Back/Edit actions, then Next of Kin and Member Dormancy, Member Activation, an approval-status timeline, board-member selection, and an approval list. The Group state adds group-specific requirements. AIMSCAMS returns Membership policy not found for the sample detail URL because no policy records exist locally.

## Recommendations

- Render a read-only detail summary with member-type-specific policy sections and approval history.
- Add group settings only for Group policies; avoid hiding those terms in generic serialized content.

Read-only browser review; no approval action or policy edit was used. Implementation commit: none; no matching local records.
