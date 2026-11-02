# Account Loan Parity Report

## Reference access
- Attempted to open the Wakandi reference URL in a read-only headless browser.
- The request returned the Wakandi SSO login page, so the authenticated loan list could not be inspected without a valid Wakandi session.
- No data was copied and no changes were made to Wakandi.

## AIMSCAMS page inspected
- Route: `/account-loan`
- URL loaded successfully
- Console errors: none
- Main heading: `Loans`
- Status tabs: `Active`, `New`, `Closed`
- Toolbar controls: loan officer filter, `Add filters`, search
- Table columns: Account number, Member name, Product, Loan officer, Status, Tenure, Loan amount (TSh), Balance (TSh), Created date, Overdue days, Provisioning status, Actions
- Empty state: `No closed loans` / `Loans in this status group will appear here.`
- Pagination and rows-per-page controls are present

## Observed gaps to close for 100% parity
1. Filter controls should use the same teal outlined styling, heights, spacing, and dropdown affordances as the clients page.
2. Status tabs should match the Wakandi tab measurements: 45 px height, 13.33 px font, no radius, white active / `#f8fafc` inactive.
3. Table header and row heights, cell padding, badge colors, empty-state icon, and action menu should be measured against Wakandi and aligned.
4. Loan amount and balance formatting must remain integer minor-unit safe.
5. All labels and badges should use the 13.44 px client-profile typography scale where the reference uses it.
6. Empty states should preserve the full table/card layout rather than replacing it with a generic panel.

## Recommendation
- Re-authenticate a read-only Wakandi session or provide an exported storage state, then capture DOM measurements and side-by-side screenshots.
- After that, implement the measured deltas in small commits, starting with filters and tabs, then table rows and empty states.
- Run `npm run typecheck`, the relevant Playwright specs, and browser verification before each commit.
