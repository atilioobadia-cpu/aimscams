# Chart of Accounts visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\accounting-chart-of-accounts\01_screencapture-cams-wakandi-co-tz-accounting-chart-of-accounts-2026-10-21-17_38_34.png`  
AIMSCAMS route: `/accounting-chart-of-accounts`

## Comparison

The reference default state has a title/action card, an opening-balance warning, and a hierarchical account table with Account Name, Code, Type, O/P Balance, C/L Balance, and Actions. AIMSCAMS had the same data and expandable groups. The chart now uses the reference title icon and title casing, outlined Add Groups/Add Ledgers/date controls, a wider Account Name column, reference-style spacing, and matching table headings. Full group names remain visible at the 1280px local browser width.

The separate reference capture shows the Ledger Details modal. AIMSCAMS has an edit modal with supported code, parent, and opening-balance fields, while several reference fields are not backed by save behavior. Clicking Add Groups or Add Ledgers shows that creation arrives with the Accounting phase; saving the ledger edit is also unavailable. The reference date range is an interactive selector, while the local matching control is display-only. These workflows remain product gaps; no account or balance was changed.

## Browser review

Compared the reference default-state and Ledger Details captures with the AIMSCAMS chart in the visible browser at 1280×720. Verified the title and controls, complete group names, account codes, headings, warning, and table spacing. Opened Add Groups and confirmed the unavailable-phase notice; no account or balance was edited. Reference financial values were not copied.

## Changes

- Added the available account code to each table row and matching column heading.
- Matched the title treatment, outlined controls, date-range shell, table headings, and proportional columns to the reference.
- Keep group/ledger creation, date-range filtering, and ledger detail persistence documented until their accounting workflows are available.

Earlier code-column commit: `8cde171` (`feat(web): show account codes in chart of accounts`). Current visual alignment changes are pending build and commit.
