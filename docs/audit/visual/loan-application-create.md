# Loan application creation visual audit

## Evidence

- Reference: `F:\Wakandi\account-loan-application-create\FULL.png` and its timestamped capture. The captures show the same create state.
- AIMSCAMS: `/account-loan-application-create`, inspected in the visible browser at 1470 × 1094 CSS px (DPR 1.0).
- No form was submitted and no application data was created.

## Measured structure

| Element | Reference | AIMSCAMS after change | Result |
|---|---:|---:|---|
| Header / expanded sidebar | 76px / 240px | 76px / 240px | Matched |
| Title card | x≈257, y≈95, h≈87px | x=256, y=94, 1198×88px | Position and height within 2px |
| First accordion | x≈257, y≈208 | x=256, y=208 | Matched |
| Collapsed sections | Separate muted gray rows | Separate muted gray rows | Structure and treatment matched |
| Details fields | Client, product, principal, tenure, grace, rate, method | Same primary fields, plus interest-on-grace | Core field order and three-column layout match |

## Changes and checks

- Replaced the horizontal step navigation with five stacked accordion sections matching the reference labels and initial open state.
- Moved installment date, loan officer, debt capacity, economic sector, and description into Additional Details so the first panel follows the reference grouping. Validation runs when that section advances.
- Moved Cancel into the title card and placed Next within the open Details panel.
- Opened Additional Details and Next of Kin in the visible browser to confirm section switching. Browser console errors and warnings: none.
- Web typecheck passed. Scoped ESLint reports the existing `react-hooks/set-state-in-effect` error at the edit-form initialization effect; this pass did not change that initialization behavior.

## Remaining differences

1. Wakandi shows “Interest On Grace Period” as a False/True select; AIMSCAMS retains its checkbox control. The values are equivalent, but the control appearance differs.
2. The reference’s exact hover, focus, and validation states are not visible in the captures. These remain unscored.
3. This shared wizard also renders the edit route. Its populated edit state still needs a separate reference comparison.

## Status

The create page title card, accordion hierarchy, open/closed appearance, field grouping, and primary navigation now align with the supplied capture. The interest-on-grace control and unobserved states remain open.
