# AIMSCAMS Development TODO

> Track progress: [ ] Not Started | [~] In Progress | [x] Completed & Verified  
> Start one by one. Mark verified only after testing with Playwright/build checks.

## PHASE 0: Foundation (4 weeks)

### Shell & Navigation
- [x] Angular 22 app setup with standalone components
- [x] Sidebar navigation with all menu items
- [x] Topbar layout
- [x] Routing setup
- [x] Navigation hover states & active states (Verified with Playwright)
- [x] Collapsible sidebar (72px) with icons visible
- [x] "Soon" items disabled properly
- [x] Mobile responsive layout
- [x] Port styling from prototype/app.html

### Auth, RBAC & Core Infrastructure
- [x] Auth & tenancy (OIDC login, tenant resolution, branch context) - Verified
- [x] RBAC system (17 roles, Entity:Action permissions) - Verified
- [x] Period management (open/close/lock periods) - Verified
- [x] Audit trail (append-only audit_event) - Verified
- [x] Design system components (grid, filter bar, forms, chips, money input) - Verified

---

## PHASE 1: Money Core (6 weeks)

### Chart of Accounts
- [x] Chart of Accounts tree view - Verified
- [ ] 347 category taxonomy integration
- [ ] Add/edit ledger accounts
- [ ] Bank/cash account flags
- [ ] Opening balances

### Posting Engine & Journal
- [ ] Posting engine integration (from packages/ledger)
- [x] Journal entries list - Verified
- [ ] Journal entry detail with balanced lines
- [ ] Outbox + worker infrastructure
- [ ] Unposted transactions queue with resubmit
- [ ] Period guard (prevent posting to closed periods)
- [ ] Idempotency keys

### Reports
- [x] Trial Balance report - Verified
- [ ] General Ledger book
- [ ] Ledger drilldown

---

## PHASE 2: Members, Savings, Teller (8 weeks)

### Dashboard
- [x] Basic Dashboard page structure
- [ ] Dashboard KPIs with real data
- [ ] Funds in/out chart
- [ ] Portfolio composition donut
- [ ] Risk snapshot / PAR buckets
- [ ] Recent activity feed

### Members/Clients
- [x] Client list (search, filters by type/status) - Verified
- [ ] Add Client wizard - Step 1: Membership Details
- [ ] Add Client wizard - Step 2: Personal Details
- [ ] Add Client wizard - Step 3: Contact Details
- [ ] Add Client wizard - Step 4: Identity
- [ ] Add Client wizard - Step 5: Residence
- [ ] Add Client wizard - Step 6: Employment & Next of Kin
- [ ] Add Group wizard (3 steps)
- [ ] Group profile with roster
- [ ] Member profile (Client 360) - Details tab
- [ ] Member profile - KYC tab
- [ ] Member profile - Income tab
- [ ] Member profile - Residence/Assets/Bank tabs
- [ ] Member profile - Members/Users/Charges tabs
- [ ] Member profile - History/Statement/Transaction/MNO tabs

### Savings & Shares
- [x] Savings & Shares page structure - Verified
- [x] Savings accounts list - Verified
- [ ] New savings account
- [ ] Savings deposits/withdrawals
- [ ] Shares account management
- [ ] Share transactions
- [ ] Interest calculation/display

### Teller Operations
- [x] Teller console (4 categories) - Verified
- [ ] Till opening with denominations
- [ ] Till balance/counting
- [ ] Till closing
- [ ] Teller transaction approval workflow
- [ ] Teller history/sessions
- [ ] Reversals (request/approve)

---

## PHASE 3: Credit/Loans (10 weeks)

### Loan Applications
- [x] Loan application list - Verified
- [ ] New application wizard - Step 1: Details
- [ ] New application wizard - Step 2: Additional Details
- [ ] New application wizard - Step 3: Next of Kin/Guarantors
- [ ] New application wizard - Step 4: Payment Destination
- [ ] New application wizard - Step 5: Documents
- [ ] Application detail with stage timeline
- [ ] 4-stage approval workflow
- [ ] Guarantor/collateral validation

### Loan Accounts
- [x] Loan list (Active/New/Closed) - Verified
- [ ] Loan detail - Summary tab
- [ ] Loan detail - Repayment schedule tab
- [ ] Loan detail - Repayments tab
- [ ] Loan detail - Guarantors tab
- [ ] Loan detail - Documents tab
- [ ] Loan detail - Transactions tab
- [ ] Loan detail - History tab
- [ ] Loan disbursement
- [ ] Loan repayments (with allocation order)
- [ ] Loan top-up
- [ ] Reschedule loan
- [ ] Write-off
- [ ] Interest waive-off
- [ ] Close loan
- [ ] Arrears & NPA classification
- [ ] Provisioning

---

## PHASE 4: Reporting Engine & Financial Statements (6 weeks)

### Report Engine
- [ ] Report definition registry
- [ ] Parameter schema & executor
- [ ] Shared report renderer (grid + export)
- [ ] Filter bar component
- [ ] CSV/XLSX/PDF export

### Accounting Reports
- [ ] Financial Position Report (Balance Sheet)
- [ ] Income Statement Report (P&L)
- [ ] Cash Flow Statement
- [ ] Cash Book
- [ ] Journal Book
- [ ] General Ledger Book
- [ ] Ledger Statement
- [ ] Monthly Trial Balance
- [ ] Comprehensive Trial Balance
- [ ] Notes of Account
- [ ] Owner's Equity
- [ ] Corporate Tax Statement
- [ ] Assets Report
- [ ] Reconciliation Report

### Operational Reports
- [ ] Loan Disbursement Report
- [ ] Loan Collection Report
- [ ] Arrears Report
- [ ] Portfolio Aging Report
- [ ] Delinquency Report
- [ ] Loan Officer Performance
- [ ] Client List Report
- [ ] Member Verification Report
- [ ] Account Statement Report
- [ ] Member Statement Report
- [ ] Daily Transaction Report
- [ ] Expense Report
- [ ] Fees Income Report
- [ ] Reversed Transaction Report

---

## PHASE 5: Regulatory Returns (8 weeks)

### Returns Infrastructure
- [ ] Template registry (dialect, code, version)
- [ ] Line sources (query/formula/manual/derived/constant)
- [ ] Returns renderer component
- [ ] Validation engine (HARD/ADVISORY)
- [ ] Returns lifecycle (draft/validate/approve/submit/amend)
- [ ] Snapshot/freeze on submit

### TCDC SACCOS Returns (MSP01-MSP11)
- [ ] MSP01 - Balance Sheet
- [ ] MSP02 - Income Statement
- [ ] MSP03 - Loans
- [ ] MSP04 - Savings
- [ ] MSP05 - Capital Adequacy
- [ ] MSP06 - Liquidity
- [ ] MSP07 - Investments
- [ ] MSP08 - Classification of Assets (derived)
- [ ] MSP09 - Risk Management
- [ ] MSP10 - Governance
- [ ] MSP11 - Other Information

### BoT MFI Returns
- [ ] MSP03 (MFI variant)
- [ ] MSP04 (MFI variant)
- [ ] MSP05 (MFI variant)
- [ ] MSP09 (MFI variant)
- [ ] MSP10 (MFI variant)

---

## PHASE 6: Operations at Scale (6 weeks)

### Import
- [ ] Member import wizard (upload/map/validate/preview)
- [ ] Account import wizard
- [ ] Transaction import wizard
- [ ] Statement import
- [ ] Import templates & batch tracking

### Transactions
- [x] All transactions ledger - Verified
- [ ] Online transactions (payment intents)
- [ ] Online payment reconciliation
- [ ] Need Attention queue
- [ ] Unmatched payment handling

### Other Operations
- [x] Requests (unified request centre) - Verified
- [ ] Messages
- [ ] Campaigns
- [ ] Business Account (WBA) - wallet, invoices, fees
- [ ] Fixed Assets register & depreciation
- [ ] Reversals management

---

## PHASE 7: Settings & Administration (Ongoing)

### Settings
- [ ] General settings (tenant, appearance, theme)
- [ ] Accounting settings (financial year, categories, cash/bank, tax)
- [ ] Branches (management, hours, holidays)
- [ ] Products - Loan products (full config)
- [ ] Products - Savings products
- [ ] Products - Interest rates, fees & penalties
- [ ] Products - Loan provisioning rules
- [ ] Policies - Membership policy (versioned)
- [ ] Policies - Credit product policy (versioned)
- [ ] Policies - Holidays
- [ ] Users management
- [ ] Roles & permissions matrix
- [ ] Services/Integrations registry

---

## CURRENT FOCUS
**Next Task:** Phase 3 — Loan application wizard (5 steps) and loan detail tabs

**Last Verified:** 10 routes rendered in browser with 0 console errors
(/clients, /savings-accounts, /loan-applications, /loan-accounts, /teller,
/transactions, /requests, /chart-of-accounts, /journal-entries, /trial-balance).
Auth guard redirect to /login confirmed. Sidebar active state, group auto-expand
and highlight pill verified on /chart-of-accounts.
