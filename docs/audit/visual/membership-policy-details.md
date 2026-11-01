# Membership policy details visual audit

Date: 2026-11-01  
References: `F:\Wakandi\settings-policies-membership-policy-1\FULL.png`, `...membership-policy-2\FULL.png`  
AIMSCAMS route: `/settings/policies/membership/[id]`

## Comparison

The references show Individual and Group membership policy detail states. Both use a summary header with status/name/member type and Back/Edit actions, then Next of Kin and Member Dormancy, Member Activation, an approval-status timeline, board-member selection, and an approval list. The Group state adds group-specific requirements. AIMSCAMS now renders the matching summary, section order, approval status, board-member selector, and approval-list table for the synthetic `VISUAL-QA-MEM` Individual draft. The local membership model does not provide an approval timeline, board assignment, or approval rows; those areas show an explicit unavailable state. Group-specific details remain unverified.

## Recommendations

- Add persisted approval history and board assignments before enabling approval controls.
- Verify group-specific detail fields after a safe synthetic Group policy fixture is available.

Read-only browser review at 1280×720; detail page/body widths were 1280px with no horizontal overflow. The draft was not edited or approved. Detail layout implementation pending build/commit/push.
