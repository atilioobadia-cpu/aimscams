# Membership policy edit visual audit

Date: 2026-11-01  
References: `F:\Wakandi\settings-policies-membership-policy-1-edit\FULL.png`, `F:\Wakandi\settings-policies-membership-policy-2-edit\FULL.png`
AIMSCAMS route: `/settings/policies/membership/[id]/edit`

## Comparison

Both reference captures use the Edit Membership Policy heading and a long, vertically divided form. The Individual form includes Basic Details, SelfOnboardingPolicy, Next of Kin, Member Dormancy, Allow Minors, Mandatory Savings, Mandatory Shares, Membership Policy Fees, Member Activation, and Mandatory Credit Products. The Group form adds Group Settings between Allow Minors and Mandatory Savings.

AIMSCAMS now places the disabled SelfOnboardingPolicy control under Individual Basic Details only, renders verification type as a select, labels the edit action Update, moves Code/Status into a collapsed AIMSCAMS Configuration disclosure, and shows the reference Add Fee action at the right of the fee section. Group Settings remains type-specific and its controls remain disabled because the policy model cannot save the group limits. Unsupported minor, savings, shares, fee, exit, onboarding, and credit-mapping fields are likewise unavailable.

## Browser review and sample state

Reviewed both forms in the visible browser at 1280×720 against the supplied full-page screenshots. The `VISUAL-QA-MEM` Individual draft now has the supported reference-like values: Next of Kin 1–2, 365 dormant days, Allow Withdraw and Auto Active Upon Deposit enabled, and Manual Member Verification enabled. The `VISUAL-QA-GRP` draft now has Next of Kin 1–4, 365 dormant days, Allow Withdraw and Auto Active Upon Deposit enabled, and Manual Member Verification enabled. Both remain Draft and retain descriptions stating they are synthetic and not for operational use. Only these supported local fields were saved; unsupported policy settings remain disabled and no approval state changed.

## Remaining gaps

- Add a typed membership-policy schema for onboarding, minor eligibility, mandatory savings/shares, fee rules, exit behavior, mandatory credit products, and Group Settings before enabling those controls.
- Add the policy approval history/assignment contract tracked in I398.
- The API model does not expose all reference policy flags, so list/detail parity remains limited too.

Code and audit note are included in the membership edit visual-refinement commit.
