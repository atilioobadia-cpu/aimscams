# Authentication visual audit

## Evidence

- Reference: `F:\Wakandi\authentication\Screenshot 2026-10-26 133158.png` (login), `133300.png` (registered-email recovery), `133329.png` (password reset).
- AIMSCAMS: `/login`, visibly inspected in the in-app browser. Current browser form was already autofilled; its contents were not copied into this report.
- Reference images are approximately 1830 × 930 px. The right-edge recorder toolbar appears in all three captures; a CAPTCHA badge appears in the reset capture. These are capture artifacts, not design targets.

## Observed differences

1. **Login identity and hierarchy:** reference uses a centered white symbol in a tall muted-green upper panel and a large overlapping white form card. AIMSCAMS uses a text wordmark and a substantially more compact centered panel.
2. **Sign-in choices:** reference login starts with a country-code selector and mobile-number field, offers “Login with Email”, then password and forgot-password controls. AIMSCAMS presents email and password directly; no phone/email mode switch is visible.
3. **Recovery flow:** reference includes a registered-email entry state with a phone-number switch, then a password reset state with code, new-password, confirmation, resend countdown, and submit. AIMSCAMS' Forgot Password page (`/forgot-password`) was also inspected: it has an email field, Send reset link, and Sign in link. No email was submitted. The local screen does not visibly offer the reference phone-number switch or the separate code/new-password/confirmation state.
4. **Shared styling:** both use a white canvas and green surfaces with teal action styling. This is palette-level similarity only; card proportions, mark, form grouping, and available choices remain different.

## Recommendations for the adjustment plan

- Decide whether the reference authentication modes and recovery steps are required product behavior before treating missing controls as visual issues.
- Compare the login card, logo/mark, field grouping, and spacing at matched DPR and viewport after a reference state map is agreed.
- Inspect the local reset-code state in a later pass; the Forgot Password form was observed but not submitted or changed.
- Record hover, focus, and disabled styling as needs-human where reference captures do not show those states.

## Status

Visual mismatch observed. Full-page pixel scoring is deferred because the reference states are separate captures, the reset-code state was not reached locally, and captures still need calibrated matching viewport/DPR.
