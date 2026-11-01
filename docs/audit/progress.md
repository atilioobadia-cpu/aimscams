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
- Implementation commit: `e86716c` (`feat(web): align loan application form with visual reference`).

## 2026-11-01 — Loan application details and edit review

- Reviewed both populated detail references and the edit reference without copying any record values into the audit.
- The local API requires UUIDs; the supplied numeric route suffixes cannot load a local record. No local application rows are available for a populated comparison.
- Recorded the missing four-stage review, assignment, approval-history, notes, score-history, audit-history, and document-tab model as a blocker.
- Updated the shared edit wizard to open on Additional Details, use the Update title, and link Cancel to the application detail page. The edit state is not browser-verifiable until a local UUID record exists.
- Web typecheck passed. Scoped lint passed with the existing edit-initialization `react-hooks/set-state-in-effect` rule suppressed for this check.
- Implementation commit: `597b4d7` (`feat(web): align loan application edit state with reference`).

## 2026-11-01 — Savings accounts reference pass

- Aligned the title/action card, persistent table header and empty row, modal width, heading, and supported form labels to the supplied screenshot.
- Opened the New saving modal in the visible browser; no save action was taken.
- The local account schema has no Account Name field, and the list has no rows. Both remain documented instead of inventing unsupported data.
- Web typecheck and scoped Savings lint passed.
- Implementation commit: `38c7d4a` (`feat(web): align savings page with visual reference`).

## 2026-11-01 — Loan detail pages and Schedule route

- Reviewed the loan summary and Schedule references; the supplied numeric loan suffix returns a UUID validation error against the local API.
- Added the missing Schedule route and Schedule navigation from the summary. The route reads only the existing schedule response and supports a status filter and CSV export.
- Recorded separate notes for summary, schedule, transactions, repayments, documents, and guarantors. Populated comparisons remain blocked by unavailable local loan records; unsupported financial columns remain unmapped.
- Web typecheck and scoped lint passed. Browser route check confirmed the new Schedule route renders without a 404; console errors and warnings were empty.
- Implementation commit: pending.
- Implementation commit: `aec5349` (`feat(web): add loan schedule route and audit detail pages`).

## 2026-11-01 — All transactions reference pass

- Aligned the title card, compact filter toolbar, optional filter menu, persistent table headings, empty state, and pager.
- In the visible browser, checked the status control sizing, optional Accounting status toggle, Save dialog feedback, clear action, and final default state.
- The local transaction list is empty. Session Date and Product Name are not in the response model. The reference Resubmit action has no safe local endpoint, and saved-filter persistence is unavailable.
- Web typecheck and scoped lint passed; see the pass commit record.
- Implementation commit: `5629690` (`feat(web): align transactions page with visual reference`).

## 2026-11-01 — Transaction workflow routes reviewed

- Visually reviewed Teller Console, Teller History, Teller Requests, Online Transactions, and Online Transaction Reconciliation against their reference captures in the visible browser and image viewer.
- Updated Teller Requests so the table headers remain visible for an empty queue. No approve/reject action was used.
- Recorded the workflow/API differences on the other routes; their reference pages require teller transaction history, provider confirmation, category workflows, and persisted statement-upload metadata that the local APIs do not currently expose.
- Browser inspection remained read-only for operational controls. Teller request implementation commit: pending.
- Teller Requests implementation commit: `4211399` (`feat(web): align teller request empty table with reference`).

## 2026-11-01 — Core accounting pages reviewed

- Compared Chart of Accounts, Journal Entries, and Ledger Entries in the visible browser against the corresponding reference screenshots.
- Added the supported account Code column to Chart of Accounts and verified it rendered. No ledger edit or accounting mutation was performed.
- Recorded the differing journal grouping/export model, unsupported ledger-edit save path, and unavailable local ledger movements.
- Chart of Accounts implementation commit: pending.
- Chart of Accounts implementation commit: `8cde171` (`feat(web): show account codes in chart of accounts`).

## 2026-11-01 — Asset register pages

- Compared Asset Types and Fixed Assets with the supplied reference states.
- Moved the existing create forms into dialogs, added title/action cards, and kept table headings visible on empty results.
- Opened and closed both dialogs in the visible browser without submitting either form.
- Reference allocation, import, and ledger-linked depreciation functions are not supported by local APIs and remain documented.
- Asset page implementation commit: pending.
- Asset page implementation commit: `11883a8` (`feat(web): align asset register pages with visual references`).

## 2026-11-01 — Accounting Reports hub and Trial Balance

- Reordered the 15 report links and aligned the landing page title card and four-column compact card grid to the supplied reference.
- Visually checked the hub and compared Trial Balance to its reference. Trial Balance hierarchy, period totals, opening-balance alert, and exports remain blocked by its local response model.
- Accounting Reports implementation commit: pending.
- Accounting Reports implementation commit: `98160a4` (`feat(web): align accounting reports hub with reference`).

## 2026-11-01 — Financial statement report review

- Compared Income Statement, Financial Position, and Cash Flow Statement pages with their supplied captures.
- Recorded their report-data gaps: comparative periods, note numbers, section subtotals, statement totals, and category schedules are absent from the local responses.
- No statement numbers were copied into the audit; no exports or accounting writes were performed.

## 2026-11-01 — Additional trial-balance variants

- Compared Comprehensive and Monthly Trial Balance routes with their reference screenshots.
- Both local routes use the flat as-of-date account response. The reference needs hierarchical period totals, monthly activity, opening/closing balances, and exports.
- Recorded both route-specific differences; no reference amounts or accounting changes were introduced.

## 2026-11-01 — Equity, Assets, Notes, and Tax report review

- Compared Owners Equity, Assets Report, Notes of Account, and Corporate Tax Statement in the visible browser against their supplied screenshots.
- Added route-specific audit notes. These references require report-specific sources: equity movement totals, registered asset rows/status, numbered note schedules, and comparative tax balances. The local routes currently show generic account balances.
- Kept the pass read-only; no exports or accounting actions were triggered.
- Implementation commit: none; report data/API gaps remain.

## 2026-11-01 — Cash Book, General Ledger Book, and Journal Book

- Visually compared all three local report routes with their supplied references in the visible browser.
- Added route-specific audit notes for the missing cash-ledger movements, per-account general-ledger groupings, and journal-book ledger lines/period totals.
- Local data remains limited to empty cash movements and one opening-balance journal entry. No exports or accounting writes were performed.
- Implementation commit: none; report data gaps remain.

## 2026-11-01 — Ledger Statement and Reconciliation routes

- Compared Ledger Statement, Reconciliation, Reconcile Statement, and Reconciliation Settings with their supplied references in the visible browser.
- Recorded that the local account selector is empty and reconciliation/report routes currently render generic chart-of-accounts balances instead of the reference workflows.
- Kept the pass read-only; no reconciliation save, submit, or export controls were activated.
- Implementation commit: none; report/workflow data contracts remain missing.

## 2026-11-01 — Reports, Requests, Messages, Import, Business Account

- Reviewed the Reports, Loan Reports, Statement Reports, Requests, Messages, Import, Business Account, and General Settings routes in the visible browser against the available references.
- Updated the Loan Reports hub title card, report ordering, labels, and card styling; verified the result visibly. The reference Loan Repayment Schedule destination has no local route.
- Recorded page-specific notes for the reviewed routes. Loan report pages currently return generic account balances; message and import pages have empty or gated states and differ from reference workflows.
- Browser inspection remained read-only: no approval/rejection, message send, import upload/commit, setting save, or financial action was used.
- Loan Reports hub implementation commit: 8875cd3 (feat/web: align loan reports hub with reference).


## 2026-11-01 — Settings pages, first pass

- Compared Users, Add User, Roles, Services, Branches, Add Branch, product settings, policy lists/forms, and Holidays in the visible browser against the corresponding `F:\Wakandi` captures.
- Added route-specific audit notes and settings rows to the visual index. Major gaps are the role management presentation, product/policy tab shells, structured lending policy model, and the holiday calendar workflow.
- Preserved the read-only boundary: no user/role/branch/product/policy creation, access changes, working-day edits, or saves were performed.
- No visual implementation changes made in this pass; business-model and workflow gaps need product/data contracts before styling alone can close them.

- Also matched General Settings to `settings-account/FULL.png` and Accounting Settings to `settings-accounting-settings/FULL.png`; corrected the earlier General Settings reference mapping. Local tenant identity controls remain AIMSCAMS-specific; tax-rate component management is absent.

- Reviewed configured-state references for loan product details, interest-rate and savings-product creation, membership policy details/edits, credit product policy details/edits, and provisioning-rule creation. Local detail records are absent; `/settings/products/provisioning-rules/new` returns 404.
- Added route-specific notes for these populated and create/edit states. No product or policy forms were submitted.

- Corrected the service reference mapping: the supplied Services capture corresponds to `/settings-service-provider`; `/settings/services` is a separate value-added-services catalogue with no reference capture. Added a read-only System Logs note; no reference screenshot is present.

## 2026-11-01 — Loan reports, first batch

- Compared Accrued Installments, Accrued Interest, All Loan, Deferred Interest, Expected Loan Repayments, Expected Payment By Date, and Expected Repayment with their supplied references in the visible browser.
- Each local route renders the same generic chart-of-accounts balance grid; the references show loan-specific date/portfolio filters and distinct financial columns. Added one route-specific note per page and issue-register entries I402–I408.
- Kept report inspection read-only; no submit, refresh, download, or financial action was triggered.
- Implementation commit: none; report query/filter contracts are missing.

## 2026-11-01 — Loan reports, second batch

- Compared Fee Status, Guarantors, Issued Loans and Arrears, Loan Aging, and Loan Arrears with their supplied references in the visible browser.
- AIMSCAMS continues to return chart-of-accounts balances for these routes. Added route-specific notes with reference filters, report fields, and risks; issues I409–I413 track missing report contracts and calculations.
- Kept review read-only; no report filters were submitted and no exports were downloaded.
- Implementation commit: none; report query/filter contracts remain missing.

## 2026-11-01 — Loan reports, third batch

- Compared Loan Disbursement, Loan Insurance, Loan Officer Income, Loan Outstanding, and Loan Repayment with the supplied references in the visible browser.
- Each local route returns the generic chart-of-accounts balance grid instead of its distinct report filters and fields. Added notes and issue-register entries I414–I418.
- Kept review read-only; no report filters were submitted and no exports were downloaded.
- Implementation commit: none; the report query and filter contracts are not present.

## 2026-11-01 — Loan reports, fourth batch

- Compared Paid Off Loans, Pending Loan Applications, Portfolio Risk, Risk Classification of Assets, Summarized Portfolio at Risk, Loan Transaction, and Written-Off Loan reports in the visible browser against their supplied references.
- All seven AIMSCAMS routes render the generic chart-of-accounts grid. Added page notes and issues I419–I425 for their distinct query, fields, calculations, and access needs.
- Reference captures include both empty states and populated risk summaries; no live report filters or exports were triggered.
- Implementation commit: none; the route-specific query, filter, and calculation contracts remain missing.

## 2026-11-01 — Cross-module audit, first batch

- Compared Chart of Accounts, Services, Roles, Journal Entries, Individual and Group Membership Policy edit states, and Member Verification Report using the supplied screenshots and the visible AIMSCAMS browser.
- Existing notes for the first six pages were confirmed against their current local routes. Both captured membership-edit URLs return 404; no matching local policy record exists. Member Verification Report was added as a page-specific note and issue I427.
- The member-verification reference contains personal names and identifiers; the audit records only field categories and does not reproduce those values.
- Review was read-only; no ledger, role, policy, or report changes were submitted.

## 2026-11-01 — Cross-module audit, second batch

- Compared Statement Reports, Recharge Credits, Teller Requests, Loan Transactions, Credit Product Policy Details, Create Message Segment, and Group Membership Policy Details in the visible browser against their references.
- Statement Reports is narrowed to two statement links in the reference while AIMSCAMS also lists transaction/client/savings reports. Teller Requests preserves its empty table headers but lacks the shared teller tabs and branch balance panel. The loan and credit-policy sample URLs return 404; the membership detail resolves to a not-found state.
- Recharge Credits and Create Segment are In Build locally; their reference form controls are recorded without triggering purchase or save.
- Updated the page notes and issues I428–I429. No teller request, message segment, loan record, policy, or credit purchase was created or changed.

## 2026-11-01 — Cross-module audit, third batch

- Compared Message Segments, Member/Account/Transaction Import Batches, Membership Policies, Loan Provisioning Rule Creation, and Business Account in the visible local browser against their supplied screenshots.
- Message Segments remains an In Build placeholder. All three local import pages show a zero-batch standalone empty card, while the references show upload/template actions, filters, and persistent table headers. The membership list has a local empty-state card with search/status controls, while the reference includes shared policy tabs and a policy table. The provisioning create URL returns 404.
- The Business Account reference is captured with Add Funds open; the local review stayed on its default wallet page. No funds were added and no financial action was opened, so dialog matching remains unverified.
- Confirmed these findings are already tracked in I373, I374, I376, I389, and I400. Updated queue statuses for all duplicate references. No new issue was needed.

## 2026-11-01 — Cross-module audit, fourth batch

- Compared Member, Account, and Transaction Import Wizards; Create Client; and the Loan Provisioning, Interest Rate, and Savings Product lists in the visible local browser against their references.
- The three AIMSCAMS import wizards expose three steps (Upload/Preview/Commit) and CSV schema text; references show four steps (Upload/Field Mapping/Validation and Preview/Result), accept CSV or Excel, and use a centered upload panel. No file was selected.
- Create Client uses a six-step wizard with a compact Membership step; the reference shows a full-page accordion form with multiple registration groups. The generated local reference-number control remained Loading. Added the page note and issue I430; no values were entered or registration submitted.
- Product lists share the missing standalone Product Setup tabs. Provisioning and interest-rate lists are empty locally; the savings reference contains a populated row while AIMSCAMS is empty. The sample row values are not copied. Existing product findings I383–I385 cover these structural gaps.
- Updated the page-specific notes and all duplicate queue rows. No files were uploaded and no product was changed.

## 2026-11-01 — Cross-module audit, fifth batch

- Compared Loan Products, Savings Product Edit, Message Templates, Interest Rate Creation, Requests, Send Message, and Loan Details in the visible local browser against their supplied references.
- Loan Products has no local rows; its reference list is populated. The sampled savings product returns a local not-found state. Product list structure was already captured in I383/I397. Interest Rate Creation still lacks frequency type/value, an end date, and fixed/variable sections from the reference.
- Message Templates uses a local inline add form while the reference emphasizes shared service navigation and a filterable template table. Requests uses status-count checkboxes and an empty card instead of the reference status tabs, filter strip, and table. Send Message uses direct recipient/body fields in place of company/segment selection; added page-specific note and issue I431.
- The supplied loan sample resolves to a UUID-validation error locally, so populated summary comparison remains blocked as tracked in UI016. No client/loan names or account values were copied.
- Updated queue statuses for all duplicate references. No product, message, request, or loan action was submitted.

## 2026-11-01 — Loan details and application states, first batch

- Rechecked Loan Repayments, Guarantors, and Documents plus both supplied Loan Application Details samples and the Edit sample in the visible browser.
- Repayments reference shows the shared loan header/tabs, component columns and a totals row; the local numeric sample returns a UUID validation error. Guarantors reference is captured with Add New Guarantor open over a populated table; Documents shows a populated file table and upload action. The local numeric loan sample fails UUID validation on each route.
- Both application-detail samples and the edit sample also fail UUID validation locally. References show the four-stage application workflow and review/history/document tabs; the edit capture opens Additional Details. Existing notes record the field and workflow gaps without reproducing names, IDs, or filenames.
- Updated the repayment, guarantor, and document notes with route-specific reference structure and all matching queue rows. No loan/application data or documents were changed.

## 2026-11-01 — Accounts and accounting, first batch

- Compared Loan Applications, Create Loan Application, Loans, Savings Accounts, Asset Types, and Fixed Assets in the visible local browser against their references. Journal Entries (#49) was already reviewed and remains tracked separately.
- Loan application and loan list structures match their reference shells; both local lists are empty while the screenshots are populated. The create-application title, Details accordion and primary fields align, with the previously recorded Interest On Grace Period checkbox/select difference still open.
- Savings Accounts is empty locally; its reference capture has the New saving Details modal open. The existing local note confirms the modal was previously inspected safely and records unsupported Account Name behavior.
- Asset Types and Fixed Assets retain the reviewed title/table/modal structures. Reference state gaps include allocation/ledger fields and fixed-asset import/entry-date behavior already tracked in I347–I348. No forms or file choosers were submitted.
- Updated queue status for all duplicate references. No account, loan, application, asset type, or fixed asset was created or changed.

## 2026-11-01 — Accounting reports, second batch

- Compared Ledger Entries, the Accounting Reports hub, Assets Report, Cash Book, Cash Flow Statement, Comprehensive Trial Balance, and Corporate Tax Statement in the visible local browser against the supplied reference screenshots.
- The report hub's title card and four-column report-card grid now match the reference structure. Ledger Entries shares the filter/empty-state intent but has account/date inputs and balance summaries in place of the reference range/account/type controls and download actions.
- Assets Report shows general-ledger account balances rather than a filtered fixed-asset register. Cash Book has account/date filters but the local sample is empty and its table omits the reference ledger grouping columns. Cash Flow Statement shows a zero movement summary rather than the operating/investing/financing schedules and prior-year comparison.
- Comprehensive Trial Balance and Corporate Tax Statement both render the generic flat chart-of-accounts balance table; the reference pages require grouped period totals and a comparative tax statement, respectively. Existing issues I033–I048 and I350, I353–I360, I354, I357, and I359 cover these findings; no duplicate issue was added.
- Updated the matching queue rows. Browser inspection was read-only; no filters were submitted, exports run, or accounting records changed.

## 2026-11-01 — Accounting reports, third batch

- Compared Financial Position, General Ledger Book, Income Statement, Journal Book, Ledger Statement, Monthly Trial Balance, and Notes of Account in the visible local browser against the supplied reference screenshots.
- Financial Position is a single-date flat Assets list instead of the comparative assets/liabilities/equity statement. Income Statement has revenue/expense account sections and totals but no current/prior period columns, note references, or reference-style report actions. Monthly Trial Balance uses a single as-of date and flat balances instead of month selection and opening/activity/closing group columns.
- General Ledger Book and Journal Book both currently display the same single opening-balance entry table; the references show account-grouped ledger lines and dated debit/credit pairs, respectively. Notes of Account is also the same generic account-balance table instead of numbered comparative schedules.
- Ledger Statement loads chart-of-accounts choices in its selector, correcting the earlier note that the selector was empty; it still lacks posting-date and entry-type controls and the reference title/export actions. Corrected I363 and its page note. Existing issues I048–I063 and I351–I352, I355, I358, I361–I363 cover these differences; no duplicate issue was added.
- Updated the matching queue rows. Browser inspection was read-only; no report filters, exports, or accounting writes were submitted.
