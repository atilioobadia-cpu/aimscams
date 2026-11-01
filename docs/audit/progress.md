# UI Match Progress

## Session 2026-10-30

### Fixes Applied (11 commits)
1. Sidebar width 204 to 230px
2. Header height 68 to 76px
3. Table header and cell styling
4. Body background #ffffff to #ebe9e9
5. Removed leaking !important body background from login layout
6. Badge border-radius to pill-radius (6px)
7. Control height 33 to 36px
8. Input/textarea padding 10px to 12px
9. Select trigger radius and height to match control tokens
10. Sidebar sub-item height 34px to 28px
11. Header border color to #c3c6ca

### Comparison Results
- Run v10: 0/142 pass, SSIM 0.72-0.95, CPR 0.3-23%
- Best pages: accounting-chart-of-accounts 0.95, settings-role 0.94, accounting-entries 0.92
- Worst pages: MSP reports 0.72-0.77 (placeholder pages)

### Next Steps
1. Font matching (FIX 1)
2. Icon standardization (FIX 2)
3. Spacing and padding (FIX 3)
4. Content differences (FIX 4)
5. Colors (FIX 5)
6. Work through queue starting with accounting-chart-of-accounts

## 2026-10-31 - colour channel correction and COA restructure

### Corrected: earlier colour readings were BGR, not RGB
Python/OpenCV reads PNG pixels as BGR. Earlier notes recorded cv2 tuples as if they were
RGB, which produced wrong targets. Corrected targets:

| Element | Old (wrong) | Measured cv2 (BGR) | Actual RGB |
|---|---|---|---|
| Page background | #e9e9eb | (233,233,235) | **#ebe9e9** |
| Brand / links | olive #737505 | (115,117,5) | **#057573** (our --primary) |
| Body text | #575049 brown | (87,80,73) | **#495057** (our --text-heading) |
| Card border | #e6e2de | (230,226,222) | **#dee2e6** (our --border) |
| Row divider | #f0e8e2 | (240,232,226) | **#e2e8f0** |
| Warning banner bg | #f2f2fd | (242,242,253) | **#fdf2f2** |
| Warning banner text | #4026dc | (38,38,220) | **#dc2626** |

Consequence: \--page-bg\ reverted to #ebe9e9, and the reference uses exactly the existing
AIMSCAMS brand teal for links and titles. No new palette needed except the alert pair.

### Chart of accounts page rebuilt to the reference layout
- White page-header card (70 CSS tall) with the title on the left and \Add groups\,
  Add ledgers and the 1-Jan-YYYY to 31-Dec-YYYY range on the right.
- Removed the AccountingNav strip; the reference carries those links in the sidebar.
- Red warning row (56 CSS tall) directly under the header card: "There is a difference in
  opening balance of <side> <amount>", computed from signed opening balances, not closing.
- Table card 8 CSS below the banner, header row 37 CSS, body rows 46 CSS.
- Columns: account name, type, O/P balance (right), C/L balance (right), actions (right).
  The Code column is gone; the reference does not show it.
- Chevron column: 24 px box at 12 px inset, name text 52 px from the card edge.

### Reference metrics confirmed at DPR 1.25
- sidebar 0..238 px white, border at 238 -> 191 CSS
- header border at y=76 -> 61 CSS
- content card 266..1811 -> 212.8..1448.8 CSS, i.e. 22 px padding
- nav row pitch 53 px -> 42.4 CSS

## Workflow (user-directed, 2026-10-31)
1. User takes screenshots of reference pages and shares them.
2. I analyze the screenshots and explain what I understand (layout, controls, data, colors).
3. I compare with our system and identify missing/mismatched elements.
4. We discuss whether the proposed changes are acceptable.
5. Implement using skills, commit, push, verify with harness.
6. Browser stays open for manual verification; user reports issues.
## 2026-11-01 — Clients reference pass

- Calibrated the reference screenshots per page and measured the shared shell at 76px header and 240px expanded sidebar.
- Updated shared sizing and the Clients page title card, filters, table density, horizontal scroll, and pagination.
- Recorded visual findings and unresolved behavior in docs/audit/visual/ and docs/audit/NEEDS-HUMAN.md.
- Verified client filters and pagination in the visible browser; web typecheck and full test suite passed.
- Repo-wide lint reports 23 errors and 106 warnings; modified-file lint completed with one existing image-element warning.
- Implementation commit: `963e0be` (`feat(web): align clients page with visual reference`).

## 2026-11-01 — Loans list reference pass

- Rebuilt the Loans list structure from the reference: title card, status tabs, compact toolbar, wide table, horizontal scroll, and pager.
- Added live loan-officer filtering by exposing officer metadata from the loan’s source application in the read-only list response.
- Verified title geometry at x=256/y=94 (1198×84), tabs y=196 (55px), table x≈277/y≈336, and 1495px table content width at 1470×1094 CSS.
- Exercised status tabs, loan-officer selector, default Status filter, optional Product filter, clear action, save-unavailable notice, and sidebar collapse/expand. No console errors or warnings were recorded.
- Web and API typechecks passed; scoped web lint passed, and the full suite passed 140 tests (API 81, worker 6, domain 34, ledger 19). API lint exited successfully with existing warnings.
- Implementation commit: `a56e9bc` (`feat(web): align loans list with visual reference`).

## 2026-11-01 — Loan applications list reference pass

- Matched the title/action card, Pending/Approved/All tabs, filter toolbar, table columns and horizontal scrolling to the supplied screenshot.
- Used existing loan-officer data; documented the missing application workflow-stage field and saved-filter persistence.
- Verified title at x=256/y=94 (1198×84), tabs y=196 (55px), toolbar x≈277/y≈270, and table x≈277/y≈336 with 1515px content width at 1470×1094 CSS.
- Exercised product/status/officer filters, clear action, empty-state feedback, and arrow-key tab navigation in the visible browser. No console errors or warnings were recorded.
- Web typecheck and scoped page lint passed. The full project suite passed 140 tests (API 81, worker 6, domain 34, ledger 19).
- Implementation commit: `69c10be` (`feat(web): align loan applications list with visual reference`).

## 2026-11-01 — Loan application creation reference pass

- Matched the title card, separated accordion sections, initial Details state, field grouping, and Cancel/Next placement to the supplied create screenshot.
- Kept existing application state and submit behavior; moved the secondary fields into Additional Details and kept their validation in that section.
- Opened Additional Details and Next of Kin in the visible browser. No browser console errors or warnings were recorded.
- Web typecheck passed. Scoped lint remains blocked by the existing `react-hooks/set-state-in-effect` warning-as-error in the edit initialization effect.
- Implementation commit: pending.
- Implementation commit: `e86716c` (`feat(web): align loan application form with visual reference`).

## 2026-11-01 — Loan application details and edit review

- Reviewed both populated detail references and the edit reference without copying any record values into the audit.
- The local API requires UUIDs; the supplied numeric route suffixes cannot load a local record. No local application rows are available for a populated comparison.
- Recorded the missing four-stage review, assignment, approval-history, notes, score-history, audit-history, and document-tab model as a blocker.
- Updated the shared edit wizard to open on Additional Details, use the Update title, and link Cancel to the application detail page. The edit state is not browser-verifiable until a local UUID record exists.
- Web typecheck passed. Scoped lint passed with the existing edit-initialization `react-hooks/set-state-in-effect` rule suppressed for this check.
