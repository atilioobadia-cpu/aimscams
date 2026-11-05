# AIMSCAMS ↔ Wakandi parity — phases plan (start to finish)

Source of truth: `docs/audit/MASTER-PLAN.md` and `docs/audit/status.md`. Work proceeds bottom-up in the sidebar menu (Settings first, Dashboard last), one task per commit, only `VERIFIED_MATCH` counts.

## Status legend
`NOT_CHECKED` · `DIFFERENCES_OPEN` · `FIXED_NEEDS_RECHECK` · `VERIFIED_MATCH` · `BLOCKED`

## Phase 1 — Settings (10 tasks)
| # | Task | Wakandi route | AIMSCAMS route | State |
|---|---|---|---|---|
| P01-T01 | Services | `/settings/service-provider` | `/settings-service-provider` | ✅ VERIFIED_MATCH (committed `d33826b`) |
| P01-T02 | Roles | `/settings/role` | `/settings-role` | DIFFERENCES_OPEN |
| P01-T03 | Users | `/settings/administrator` | `/settings-administrator` | DIFFERENCES_OPEN |
| P01-T04 | Auto Debit | `/settings/auto-debit` | `/settings/auto-debit` | DIFFERENCES_OPEN (local placeholder) |
| P01-T05 | Policies | `/settings/policies` | `/settings/policies` | DIFFERENCES_OPEN |
| P01-T06 | Products — Savings | `/settings/products/savings` | `/settings/products/savings` | DIFFERENCES_OPEN |
| P01-T07 | Products — Loan | `/settings/products/loan` | `/settings/products/loan` | DIFFERENCES_OPEN |
| P01-T08 | Products — Interest Rate | `/settings/products/interest-rate` | `/settings/products/interest-rates` | DIFFERENCES_OPEN |
| P01-T09 | Products — Fee & Penalties | `/settings/products/fee-penalties` | `/settings/products/fee-penalties` | DIFFERENCES_OPEN |
| P01-T10 | Products — Loan Provisioning | `/settings/products/loan-provisioning` | `/settings/products/provisioning-rules` | DIFFERENCES_OPEN |
| P01-T11 | Branches | `/settings/branch` | `/settings/branches` | NOT_CHECKED |
| P01-T12 | Accounting settings | `/settings/accounting-settings` | `/settings/accounting` | NOT_CHECKED |
| P01-T13 | General settings | `/settings/account` | `/settings/general` | NOT_CHECKED |

## Phase 2 — Business Account
- P02-T01 Business Account hub (`/core/wba/business-account` ↔ `/business-account`) — NOT_CHECKED
- All live subpages, details, filters, actions.

## Phase 3 — Import
- Member, Account, Transaction import flows (steps, validation, errors, result states) — NOT_CHECKED.

## Phase 4 — Reports
- Discover complete report nav from live Wakandi menu; inspect every report detail in reverse menu order, then hubs.
- Loan, Savings, Transactions, Client, MSP, Statement hubs + all live detail pages — NOT_CHECKED.

## Phase 5 — Campaigns
- Run Campaign + Active Campaigns, dialogs, non-mutating action states — NOT_CHECKED.

## Phase 6 — Messages
- Messages list, filters, detail, safe actions — NOT_CHECKED.

## Phase 7 — Requests
- Requests list, detail, filters, safe actions — NOT_CHECKED.

## Phase 8 — Transactions
- All, Online, Teller (AIMSCAMS must expose only these three subnav items) — NOT_CHECKED.

## Phase 9 — Accounting
- Accounting Reports, Fixed Asset, Asset Types, Ledger Entries, Entries, Chart of Accounts (in that order) — NOT_CHECKED.

## Phase 10 — Accounts
- Savings, Loans, Applications (lists, details, forms, filters, empty states) — NOT_CHECKED.

## Phase 11 — Client
- Profile tabs reverse order (History → Summary), forms, lists, filters, details, safe actions, overflow nav — NOT_CHECKED.

## Phase 12 — Dashboard
- Loans, Members, Overview — NOT_CHECKED.

## Phase 13 — Global sweep
- Recheck shared header/profile, sidebar, nav counts/order, responsive layout, common dialogs, focus/hover, scroll containers, console/network, CI — runs after all phases.

## Current totals
- VERIFIED_MATCH: 1 (Services)
- DIFFERENCES_OPEN: 12
- NOT_CHECKED: 1 (Branches) + ~76 pages in Phases 2–13
- Total tracked: 14 tasks; ~90 pages in full product.

## Next move
Continue Phase 1 in order: **P01-T02 Roles** → P01-T03 Users → … → P01-T13 General, then Phase 2 onward. One task per commit, pushed to GitHub.
