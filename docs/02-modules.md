# 02 — Module & Screen Inventory

Every screen observed in the 145-route surface, grouped by the application's own navigation.
Route slugs are the URL segments after `cams.wakandi.co.tz/` and are the most useful handle
when you start cutting vertical slices.

Navigation as rendered:

```
Dashboard · Client · Accounts · Transactions · Accounting · Requests · Messages
· Campaigns · Reports · Import · Business Account · Settings
```

---

## 1. Dashboard

| Route | Screen | Purpose |
|---|---|---|
| `dashboard` | Dashboard | Entry point after login; tenant identity, branch selector, KPI tiles |

Observed shell (present on every screen):

- Tenant name + Wakandi account id (`MFSL MFI 101457`)
- Branch selector (`Main Branch`) and **Open** branch/period chip
- User chip with role menu (`FRANKO SANGA EKSAUDI v`)
- Footer: `© 2026 Wakandi. All rights reserved.` + language (`English`)

The shell is worth building first: branch context and period context are ambient inputs to
almost every query in the system.

---

## 2. Client

The client module is the widest single module. A "client" is either an **individual** or a
**group**, and both share one profile shell with type-specific tabs.

### 2.1 Screens

| Route | Screen | Capabilities |
|---|---|---|
| `clients` | Client list | Search by Member Id; filters Type / Status; columns Member Id, Full Name, Type, Status, National Id, Reference Number, Phone, Email, Address; actions Add Client, Add Group, Add Filters, `ClientActivationLink` |
| `clients-create` | Add Client wizard | Membership → Personal → Contact → Identity → Residence → Employment |
| `clients-create-group` | Add Group wizard | Membership Details → Group Details → Meeting Schedule |
| `clients-group-1789` | Group profile | Full member-profile shell for a group, plus member roster |

### 2.2 Add Client wizard — fields by step

**Step 1 — Membership Details**
`Policy*` (membership policy, e.g. `INDIVIDUAL`), `Reference Number`, `Client Manager*`,
`Date of Joining*`, `Branch*`, `Group` (optional parent group).

**Step 2 — Personal Details**
`First Name*`, `Middle Name`, `Surname*`, `Gender*`, `Date of Birth*`, `Marital Status`,
`Nationality`, `Number Of Dependents`, `Person With Disability` (Yes/No) and conditional
`Impairment Type`.

**Step 3 — Contact Details**
`Phone Number*`, `Email ID`, `Country code`, `Address Line 1..3`, `Region / State*`,
`District / City*`, `Area / Ward`, `Pincode / Zip`, `House Number`, `Country`.

**Step 4 — Identity Number**
`National ID Number`, `Tax Number (TIN)`, plus document upload.

**Step 5 — Residence**
Region / District / Ward / Address lines / Pincode, `+ Add Residence` for multiple.

**Step 6 — Employment**
`Employment` vs `Business`; `Company Name`, `Company Address`, `Monthly Income`,
`Business Address`, `Business Registration Number (BRELA)`, `Business License Number`,
`TIN Number`, `Business Turn Over (weekly/yearly)`, `Contract Type`.

**Next of kin** (minimum 1, maximum 2 per membership policy):

`Nominee1 Name`, `Nominee1 DOB`, `Nominee1 Relation` (Wife/Brother/Father/Husband/…),
`Nominee1 ID Number`, `Nominee1 Tax Number`, `Nominee1 Percentage`,
`Nominee2 …` (same shape).

> The nominee percentage is a real allocation field with a sum-to-100 rule. Validate it.

### 2.3 Group creation

**Membership Details** — `Policy*` (e.g. `GROUP POLICY`), `Reference Number`,
`Relationship Manager*` / Client Manager, `Date of Joining`.
**Group Details** — `Group name*`, `Group Code`, `Group Type` (e.g. `Others`), `Branch*`,
`Parent group`, address block.
**Meeting Schedule** — `Group Meeting Day`, `Frequency`, `Recurrence Day`, `Recurrence date`.

Groups also carry `Group Member Type` on each member (observed values like
`Mwanachama`, `Mwenyekiti`, `Katibu`, `Mjumbe` — i.e. ordinary member, chairperson,
secretary, committee member).

### 2.4 Client profile tabs

`Details · KYC · Income · Residence · Assets · Bank · Members · Users · Charges · History ·
Statement · Transaction · MNO`

| Tab | Content |
|---|---|
| **Details** | Member Id, Type, Policy, Reference Number, Group Name, Member Type, Branch, Status, Client Manager, contact block, membership block |
| **KYC** | Document list with type, upload date, comments; `+ Add KYC`, `Approve KYC`, max 5 MB per file |
| **Income** | Employment / business record; monthly income; turnover |
| **Residence** | One or more addresses; region/district/ward |
| **Assets** | Asset register used for collateral eligibility: `Type*`, `Value*`, `Location`, `Comments / Notes` |
| **Bank** | `Bank Name*` (CRDB, NMB, …), `Account Number*`, `BIC/Swift code` |
| **Members** | Group roster: name, phone, member type; `+ Add Group Member`, `+ Invite User` |
| **Users** | Portal users attached to the member/group, with `Role` (e.g. `Owner`) |
| **Charges** | Ad-hoc member charges: `Charges Type*`, `Amount*`, `Creation Date`, `Due Date`, `Outstanding Days`, `Outstanding Amount` |
| **History** | Audit-style timeline of profile changes |
| **Statement** | Date-ranged statement with `Submit`, `Print`, `Download` |
| **Transaction** | Member transaction ledger |
| **MNO** | Mobile network operator wallets linked to the member; `+ Add MNO` |

Group profiles additionally expose `Total Members`, `Meeting Schedule`, `+ New loan
application`, `+ Add saving`, `+ Add share`, `Deactivate`, and `Activate Business Account`.

### 2.5 Account snapshot cards on the profile

The profile shows live product cards per member:

- **Loans** — account number + short code (e.g. `953230000163 [1kr3tn]`), product, amount,
  tenure, interest, `DR/CR` balance, application status.
- **Loan Applications** — application count and latest status.
- **Savings / Shares** — balance and status.

This is the single most useful screen in the product: it is the member's 360° view. Design
its API as one composed read model, not seven parallel calls.

---

## 3. Accounts

Three sub-modules: **Applications**, **Loans**, **Savings**.

### 3.1 Loan applications

| Route | Screen | Capabilities |
|---|---|---|
| `account-loan-application` | Application list | Search, status filter, pending queue |
| `account-loan-application-create` | New application wizard | 5 steps (below) |
| `account-loan-application-details-39` | Application detail | Stage timeline, approvals, documents |
| `account-loan-application-edit-39` | Edit application | Editable until first approval |

**Wizard step 1 — Details**

`Client*`, `Product*`, `Principal*`, `Tenure*`, `Tenure Period*` (Months/…), `Grace Period`,
`Interest Rate*` (e.g. `3.5% per Month - Fixed`), `Interest Calculation Method*`
(`Reducing Balance With Equal Installment`), `Interest On Grace Period` (Yes/No),
`Installment Start Date*`, `Loan Officer*`, `Debt Capacity`, `Economic Sector*`,
`Sub-Economic Sector`, `Sub-Sub Economic Sector`, `Description`.

**Step 2 — Additional Details** — product-driven questions, guarantor/collateral intent,
disbursement preferences.

**Step 3 — Next of Kin** — nominee selection from the member's KYC nominees.

**Step 4 — Payment Destination** — bank account, MNO wallet, or cash.

**Step 5 — Loan Documents** — attachments.

> `Economic Sector → Sub → Sub-Sub` is not decoration. It is the axis of the MSP03
> sectoral classification return. Capture it as a three-level code list.

### 3.2 Loan accounts

| Route | Screen |
|---|---|
| `account-loan` | Loan list (tabs `Active`, `New`, `Closed`; filters Loan Officer, Product, Status) |
| `account-loan-details-118-summary` | Loan detail — Summary |
| `-schedule` | Repayment schedule |
| `-repayments` | Repayment history |
| `-guarantors` | Guarantors + collateral |
| `-documents` | Documents |
| `-transactions` | Loan transaction ledger |
| `-history` | Status/stage history |

**List columns:** Account Number, Member Name, Product, Loan Officer, Tenure, Loan Amount,
Status (`Disbursed`), outstanding balance shown as `DR`.

**Summary tab shows:** product policy version, nominal interest rate per month, debt capacity,
provisioning status, principal, interest, charges, balance, disbursement and expiry dates.

**Actions:** `Online repayment`, `Edit`, `Loan Top-Up`, `Reschedule Loan`, `Write Off`,
`Interest Waive Off`, `Close loan`, `Delinquent`.

**Schedule tab:** installment number, due date, principal due, interest due, fees, total due,
paid, balance, status.

**Guarantors tab:** `Member / Others`, `Block Amount`, `Percentage`, `Blocked Fund`,
`Guarantee Type`, `Minimum Number Of Guarantors`.

**Collateral:** `Asset Name`, `Type` (fixed asset), `Current Valuation`, `Block Amount`,
`Comment`, `Document`, `Collateral Ratio` (e.g. `150 %`).

### 3.3 Savings accounts

| Route | Screen | Capabilities |
|---|---|---|
| `account-saving` | Savings list | Filter Product / Member ID / Status; columns Account Number, Member Name, Product, Type, Creation Date, Status |
| `account-saving` (modal) | New saving | `Client/Member*`, `Product*`, `Account Name`, `Creation Date` |

Savings account types observed: `Primary`, plus per-product accounts. Products may be marked
`Allowed As Guarantor`, `Allowed As Collateral`, `Allowed Multiple Accounts`,
`Allow Interest Payout`.

---

## 4. Transactions

The transaction module is the operational heart. `transaction-teller-transaction` alone
accounted for **29 screenshots** — it is a deep, tabbed console.

| Route | Screen |
|---|---|
| `transaction-teller-transaction` | Teller console |
| `transaction-teller-transaction-request` | Teller transaction approval request |
| `transaction-teller-transaction-history` | Teller history |
| `transaction-online-transaction` | Online collections |
| `transaction-online-payment-reconciliation` | Reconciliation + statement upload |
| `transaction-all-transaction` | Unified transaction ledger |

### 4.1 Teller console — four categories

**A. Client Transaction** (11 types)

`Shares Deposit`, `Shares Withdrawal`, `Savings Deposit`, `Savings Withdrawal`,
`Loan Repayment`, `Disburse Loan`, `Loan Application Fee`, `Apply Fee/Penalty`,
`Reverse Fee/Penalty`, `Error Correction`.

**B. General Ledger** (8 types)

`Record Receipt`, `Record Payment`, `Other Income`, `Record Expense`, `Pay Corporate Tax`,
`Journal Entry`, `Bank/Cash Transfer (Contra)`, `Reverse General ledger entry`.

**C. Till Administration** (3 types)

`Till Opening`, `Till Balance`, `Transfer`.

**D. Bulk Transaction** (2 types)

`Bulk Deposit` (savings + shares across many members), `Bulk New Loan Disbursement`.

### 4.2 Teller session and till

- Teller has a state: **Open** / **Closed**, and a current balance shown as `DR`.
- **Till Opening** captures denominations:

  `10000 · 5000 · 2000 · 1000 · 500 · 200 · 100 · 50`

  with a computed float total, an assignee, and a reason.
- Opening a till is submitted as a **request** (approval required), not applied directly.
- **Till Balance** compares counted cash against the system balance.
- **Transfer** moves value between tills/vault (`953290000001 Vault`,
  `…000002 Cash on Hand`, branch bank accounts).

### 4.3 Common transaction fields

`Client / Member*`, `Account*`, `Transaction Type*`, `Amount*`, `Payment Method`,
`Transaction Date`, `Value Date`, `Cheque Number`, `Receipt Number`,
`Transaction Reference Code`, `Comment / Narration`, `External ID`, `Provider`.

### 4.4 Reversals

`Reverse Fee/Penalty`, `Reverse General ledger entry` and `Transaction : Reversal Approval`
permission imply a two-step reversal: request → approve. A reversal never deletes; it posts
a mirrored entry and marks the original as reversed.

### 4.5 The unposted-transactions banner

The all-transactions screen carries:

> *"3 transaction(s) are submitted but not posted to accounting. Which can affect balances in
> CAMS Accounting. Click on the Resubmit button to process them."*

Every transaction therefore has **two status axes**:

| Axis | Values seen |
|---|---|
| Operational status | `Submitted`, `Approved`, `Reversed`, `Cancelled` |
| Accounting status | `Pending`, `Posted`, `Failed` |

Build these as separate columns with a reconciliation job and a resubmit action.

### 4.6 Online collections and reconciliation

`transaction-online-transaction`: initiate an online transaction, choose provider,
capture reference; list shows external id, amount, status, member.

`transaction-online-payment-reconciliation`: upload a provider/bank statement, match lines to
system transactions, resolve unmatched items. Unattributed payments route to
**Need Attention** using the tenant's preferred savings product rule.

---

## 5. Accounting

| Route | Screen |
|---|---|
| `accounting-chart-of-accounts` | Chart of accounts (tree + ledger detail) |
| `accounting-entries` | Journal entries (list + entry detail) |
| `accounting-ledger-entries` | Ledger entries (per-ledger drilldown) |
| `accounting-assets` | Asset types |
| `accounting-fixed-asset` | Fixed asset register |
| `accounting-reports` | Report hub (15 reports) |

### 5.1 Chart of accounts — observed structure

Ledgers carry: `Ledger name*`, `Ledger code*`, `Opening Balance`, `Opening Date`,
`Bank or cash account` (Yes/No), `Reconciliation` (Yes/No), `Category`, `Group`,
`Parent group*`, `Group Code`.

Observed codes and groups in the live tenant:

| Code | Ledger | Group |
|---|---|---|
| 1001 | Wakandi | Cash & cash equivalents |
| 1002 | Cash on Hand | Cash & cash equivalents |
| 1003 | BANK CRDB | Cash & cash equivalents |
| 1005 | BANK NMB | Cash & cash equivalents |
| 1010 | TELLERS | Cash & cash equivalents |
| 1011 / 1012 | Teller 2 / Teller 1 | Cash & cash equivalents |
| 1201 | ASSET LOAN | Total loans |
| 1202 | EMERGENCY LOAN | Total loans |
| 1203 | BUSINESS LOAN | Total loans |
| 1205 | STAFF LOAN | Total loans |
| 1206 | LOAN SUSPENSE | Total loans |
| 1505 | Interest Receivable | Current assets |
| 1701 | Furniture & Fittings | Non-current assets |
| 1702 | Office Equipment | Non-current assets |
| 1706 | Software Licenses | Non-current assets |
| 2001 | Tax Payable | Current liabilities |
| 2004 | Overpayments | Current liabilities |
| 2005 | Accounts Payable | Current liabilities |
| 3404 | Share Capital | Change of owners' equity |
| 4001 / 4002 / 4004 / 4005 | Interest income variants | Interest income |
| 4101 | Loan Management Fee | Other income from loans |
| 4103 | Insurance | Other income from loans |
| 4104 | Loan Penalty | Other income from loans |
| 5004 | Write-off Bad Loans | Expenses / losses written off |
| 5100 | HR & Development | Operating costs |
| 5102 / 5103 / 5107 / 5108 | Training, Consultancy, Repairs, Board Expenses | HR & development |
| 5200 | Administrative Costs | Operating costs |
| 5201–5217 | Salaries, Rent, Utilities, Internet, Stationery, Cleaning, Advertising, Office Supplies, Professional Fees, Insurance, Licence & Regulatory, Software Subscription, Depreciation, Travelling, Marketing, NSSF, S/Duty Lease | Administrative costs |
| 5501 | Wakandi Fees | Other costs |
| 5502 | Bank Charges | Other costs |

**Equity funds** configured outside the numbered ledger tree:
`Statutory Reserve Fund`, `Share Transfer Fund`, `Bad & Doubtful Debt Provision`,
`Insurance Fund`, `Revaluation Reserves`, `Grants`, `Education Fund`.

**Internal account numbering** (from `Settings → Accounting → Cash/Bank Accounts`):

| Internal account | GL code |
|---|---|
| `953290000001` | 1001 Wakandi |
| `953290000002` | 1002 Cash on Hand |
| `953290000011` | 1003 BANK CRDB |
| `953290000064` | 1005 BANK NMB |

Member-facing numbering: client `9532002xxx`, loan `95323000xxx`, internal `95329000xxx`.

### 5.2 Entries

Columns: `Entry ID`, `Date`, `Entry Type` (`Receipt` / `Payment` / `Journal`), `Status`
(`Posted` / `Archived`), `Ledger Code`, `Ledger Name`, `Debit (TSh)`, `Credit (TSh)`,
`Narration`, `Comment`. Filters: date range, entry type, status; exports PDF / CSV / Excel.

Entry detail shows the balanced line set:

```
Entry Number: 31953200001057     Date: 12-Oct-2026
Entry Type: Receipt              Status: Posted
Line 1: [1005] BANK NMB          Cr 155,036.96
Line 2: [4005] INTEREST INCOME   Dr  24,500.00
Line 3: [1205] STAFF LOAN        Dr 130,536.96
Narration: ATILIO OBADIA MTOKOMA [953230000113] | Teller - Bank - Repayment
Comment:   Being loan repayment
```

Note the compound posting: one repayment splits principal (asset) from interest (income).
That allocation logic belongs in the domain, not in the UI.

### 5.3 Fixed assets

`Asset Types` defines categories; `Fixed Asset` is the register with acquisition, valuation,
depreciation and disposal. Depreciation posts to `5200 → Current year depreciation`.

### 5.4 Accounting reports (15)

`Trial Balance Report`, `Financial Position Report`, `Assets`, `General Ledger Book`,
`Comprehensive Trial Balance`, `Monthly Trial Balance`, `Cash Book`, `Reconciliation`,
`Income Statement Report`, `Notes of Account`, `Journal Book`, `Corporate Tax Statement`,
`Ledger Statement Report`, `Cash Flow Statement`, `Owner's Equity`.

Reconciliation has its own settings screen (`accounting-reports-reconcile-statement-settings`).

---

## 6. Requests

| Route | Screen |
|---|---|
| `requests` | Request centre, tabs: `Total`, `Active`, `Pending`, `All`, `Approved`, `Rejected`, `Cancelled`, plus `Assigned Requests` |

Columns: `Request Type`, `Amount`, `Current Assignee`, `Request Status`, `Approved by`,
`Approval Date`, `Created Date`, `Request by User`.

Requests are the generic approval vehicle used by:
- till open/close and transfers,
- transaction reversals,
- fee/penalty reversal,
- GL manual entries above a threshold,
- loan write-off and interest waiver (where not covered by the credit workflow).

Modelling this as one polymorphic request entity with a typed payload avoids five parallel
approval implementations.

---

## 7. Messages

`Message Service` with tabs `Logs · Templates · Segments · Users · Credits`.

| Route | Screen | Capabilities |
|---|---|---|
| `messages-message-logs` | Delivery logs | Columns Date, Recipient, Type, Message Type, Template, Sending Status, Credits, Company; 904 entries observed |
| `messages-template-list` | Templates | 70 templates; columns Name, Template Key, Type, Version, Costing, Status; enable/disable |
| `messages-template-list-create-3793` | Edit template | Per-language tabs (English / Swahili); Email subject+body, SMS text with character count, Push title+body |
| `messages-segment-list` | Segments | Name, Alias, Date, Enable/Disable |
| `messages-segment-list-create` | Create segment | `Name*`, `Description`, `Create Filters` → filter builder |
| `messages-send-message` | Send | `Type*`, `Template*`, `Segment*`, `Company*`, `Test Message` |
| `messages-users-list` | Message users | 1 207 entries; Name, Phone, Email ID; enable/disable SMS/email per user |
| `messages-recharge-credits` | Recharge | `Credit*`, `Description`, shows `WBA Balance`, `Total cost`, `Buy Credits` |

Template types: `Account`, `User`, `Notification`, `Transaction`, `Invitation`, `Marketing`,
`Jobs`. Channels: Email, SMS, Push. Message types: Transactional, Marketing, Notification.

Message costs are settled from the **WBA wallet** — messaging and billing are linked.

---

## 8. Campaigns

Present in navigation; no screens were captured. **Treat as unbuilt/unknown.** If required,
it is a thin scheduler over the segment + template primitives that already exist in Messages.

---

## 9. Reports

Hub with five families. 36 operational reports + 17 regulatory returns.

### 9.1 Loan reports (25)

| Report | What it answers |
|---|---|
| `ActiveLoanReport` | Every live loan with principal, interest, outstanding, arrears |
| `AllLoanReport` | All loans regardless of status |
| `PendingLoanApplications` | Pipeline: application stage, assignee, requested amount |
| `LoanDisbursementReport` | Disbursements in a period |
| `LoanRepaymentReport` | Repayments split principal / interest / charges |
| `LoanOutstandingReport` | Opening, repaid, outstanding, arrears per loan |
| `LoanArrearsReport` | Days in arrears, principal in arrears %, interest/penalty in arrears |
| `LoanAgingReport` | Buckets: Performing, Watch, Substandard, Doubtful, Loss |
| `PortfolioRiskReport` | PAR per loan, arrears rate, last repayment |
| `SummarizedPortfolioAtRiskReport` | Portfolio-level PAR: active borrowers, overdue principal/interest |
| `RiskClassificationOfAssets` | Provisioning class per asset and the rule applied |
| `IssuedLoansAndArrearsReport` | Issued vs arrears, charges and penalty in arrears |
| `ExpectedLoanRepaymentsReport` | Expected vs due principal/interest/charges per loan |
| `ExpectedRepaymentReport` | Installment-level expected amounts |
| `ExpectedPaymentByDateReport` | Cash-flow forecast by due date |
| `AccruedInterestReport` | Interest accrued to date |
| `AccruedInstallmentsReport` | Installments accrued but not due |
| `DeferredInterestReport` | Deferred interest position |
| `FeeStatusReport` | Charge-level fee status and overdue days |
| `GuarantorsReport` | Guarantor exposure: loan amount, outstanding, savings, share capital |
| `LoanInsuranceReport` | Insurance premium per loan and provider |
| `LoanOfficerIncomeReport` | Income attributed to each loan officer |
| `PaidOffLoansReport` | Closed loans with totals paid |
| `TransactionReport` | Loan-linked transactions |
| `WrittenOffLoanReport` | Write-off amount, reason, initiator, recoveries |

Canonical column set shared by the loan family (useful as a base view):

`Account Number · Loan Number · Client Name · Client Reference ID · Member Id · Member Type ·
Membership Policy · Group · Branch · Region · Phone · National ID · Gender · Age ·
No Of Dependents · Person With Disability · Impairment Type · Loan Product · Loan Officer ·
Tenure · Tenure Type · Creation Date · Disbursement Date · Expiry Date · Due Date ·
Principal Amount · Interest Amount · Charges · Outstanding Principal · Outstanding Interest ·
Outstanding Charges · Outstanding Penalty · Total Outstanding · Total In Arrears ·
Overdue Days · Loan Status`

### 9.2 Savings reports (3)

`SavingReport` (opening, debit, credit, reserved, closing per account),
`SavingSnapshotReport` (point-in-time balances),
`SavingBeyondPolicyLimitsReport` (transactions breaching product limits).

### 9.3 Client reports (2)

`ClientListReport` — the widest table in the system: identity, address, KYC, nominee,
membership, tax, and relationship-manager columns.
`MemberVerificationReport` — KYC verification status. *(Screenshot OCR'd empty; reconstruct
from the KYC tab.)*

### 9.4 Statement reports (2)

`AccountStatementReport` (by account, date range),
`MemberStatementReport` (by Member Id — required field, validated with
`"Member Id is required."`).

### 9.5 Transaction reports (4)

`DailyTransactionReport`, `ExpenseReport`, `FeesIncomeReport`,
`ReversedTransactionReport` (with reversal user/date/time).

### 9.6 Regulatory returns (17)

`MSP01`–`MSP11`, with parallel SACCOS (TCDC) and MFI (BoT) variants. Detailed in
**06-regulatory-reporting.md**.

Every report screen shares the same shape: a filter bar (date preset `Last 7 Days` /
`Last 30 Days` / `Today`, plus branch, region, product, officer), `Submit`, `Clear`, a result
grid, and `Download`. **Build this once.**

---

## 10. Import

| Route | Screen |
|---|---|
| `import-member`, `import-member-new` | Member import |
| `import-account`, `import-account-new` | Account import |
| `import-transaction`, `import-transaction-new` | Transaction import |

Each importer is a 3-step wizard:

1. **Upload File** — CSV or Excel (`.csv`, `.xlsx`, `.xls`), max **10 MB**.
2. **Field Mapping** — map source columns to system fields.
3. **Validation And Preview** → **Result**.

Batch list columns: `Batch Reference Id`, `File`, `Date`, `Status`, `Total Records`,
`Uploaded By`, `Uploaded Records`. Sample batch: 1 061 records from
`Updated Chamwapita members list.xlsx`.

Templates: `Member Template`, `Account_Standard_Template.xlsx`,
`Transaction_Template.xlsx`, plus `1792648401240_statement.xlsx` (statement import).

---

## 11. Business Account (WBA)

The platform operator's own billing relationship with the tenant. Not SACCO business logic —
but it is in the product, so build it as a **separate bounded context** with its own ledger
codes. In AIMSCAMS the operator is AIMS: the observed account names (`1001 Wakandi`,
`5501 Wakandi Fees`) and setting keys (`MoveWakandiFeesToSystemExpense`) become AIMS-branded
equivalents at seed time.

| Element | Detail |
|---|---|
| Balances | `Fees Wallet (TSh)`, `Due Amount`, `Pending Settlement`, `Balance` |
| Status | `ACTIVE` |
| Alerts | *"Your wallet balance is low. Please top up to continue uninterrupted service."* |
| Actions | `+ Add Funds`, `Quick Loan`, `Fee Settings`, `Expenditure`, `Pending Settlement`, `Invoices`, `Statement Download` |
| Invoices | `TZ-001044`, `TZ-001045`; name e.g. `MFSL MFI - Unpaid Invoice for September 2025`; duration `Sep 1, 2025 - Sep 30, 2025`; amount, discount, status `Draft`/`Paid` |
| Add Funds | `Top Up` vs `QuickLoan Top Up`, `Amount*`, `Payer*`, `Provider*`, `Message` |
| Fee Settings | `Convenience Fee`, `WBA Ledger Code 1001`, `Charge Ledger Code 5501`, `Liability Ledger Code 2002`, `MoveWakandiFeesToSystemExpense` |
| Settlement | Only the `Pending Settlement` amount transfers to the bank in the next cycle |

Governing rule: **inward transaction charges paid by the SACCO post to 5501; charges paid by
the member post to 2002; the wallet itself is 1001.**

---

## 12. Settings

Seven tabs: `General · Accounting · Branches · Products · Policies · Users · Roles · Services`.

### 12.1 General

Tenant identity (see `01-system-overview.md §6`), `Update PIN`, `Edit`, plus an **Appearance**
panel: `Appearance Style` (Modern / Classic), `Dark Mode`, `Primary Color`, `UI Scale`
(Compact / Comfortable), `Reset to Defaults`, `Save Settings`.

### 12.2 Accounting

| Section | Content |
|---|---|
| Financial Year | start/end, current + prior year rows (`01-01-2026 → 31-12-2026`) |
| General settings | financial-year defaults |
| Manage categories | 347 category rows (`Short Term Loans`, `Medium Term Loans`, `Long Term Loans`, `Loan Participations`, `Less Allowance Loan Losses`, `Total Net Loans`, …) with parent category — this is the MSP01 line-item taxonomy |
| Cash/Bank Accounts | 4 accounts mapped to 1001 / 1002 / 1003 / 1005; `+ Add Account`, `Update Account` |
| Tax Rates | code, rate %, ledger code, tax components |
| Inter-Branch Setting | `Inter-Branch Ledger Code` |

> The 347 "categories" are the bridge between the general ledger and the statutory return
> lines. This mapping table is one of the most valuable assets in the product.

### 12.3 Branches

List + `Add Branch`: `Branch Name*`, `Branch Address`, `Branch Code`, `Region / State*`,
`District / City*`, `Ward`, `Number Of Employees`, `Set as Default Branch`,
**Opening Hours** per weekday with `Copy Mon to All`, and **Special Dates & Holidays**
(`+ Add Date`, name, open/closed) that override the weekly schedule.

### 12.4 Products

Four product families, each with its own editor:

**Loan product** — the richest configuration surface in the system:

| Group | Fields |
|---|---|
| Identity | `Name`, `Description`, `Status` (Active), `Loan Type` (`Business Individual Loans`), `Quick Loan`, `Loan Provisioning`, `Enable Multiple Disbursements (Loan Tranche)`, `Enable Multiple Loans` |
| Limits | `Minimum Loan Amount`, `Maximum Loan Amount`, `Tenure Period` (`4 - 96 Months`), `Grace Period`, `Multiplier On Savings`, `Multiplier On Shares` |
| Interest | `Interest Rate` (`3.5% per Month - Fixed`), `Interest Rate Calculation Method` (`Reducing Balance With Equal Installment`), `Fixed Yearly Interest`, `Interest On Grace Period`, `Configure Type` (`Accrual`), `Accrual Interest Calculation Term` (`On Due Date`), `Accrue interest after maturity`, `% cap on principal Borrowed is required` |
| Repayments | `Auto Debit`, `Repayment Strategy` (`Charges, Interest and Principal`), `Advance Payment Strategy`, `Advance Payments Adjustment` (`Adjust Next Installment`), `Pre-closure Interest Calculation`, `Recalculate Interest On Repayment`, `Recalculate Interest On Accrual`, `Interest Compounding On`, `Balloon Payment` |
| Arrears | `Before Due Date Notification Days`, `Over Due Date Notification Days`, `After Default Notification Days`, `Number of Grace Period Before Moving Into Arrear`, `Number Of Days Before Becoming NPA`, `Exclude holidays on arrears` |
| Guarantors & collateral | `Guarantors` (`Members` / `Others`), `Minimum Number Of Guarantors` (`2`), `Member Guarantors Account Types`, `Self Guarantors Account Types`, `Collateral Type`, `Collateral Ratio` (`150 %`) |
| Charges | `LOAN MANAGEMENT FEE` 5% of Loan Amount, `LOAN PENALTY` 0.5% of Current Due Principal And Interest; `Payment Mode` (`Payment Upon Processing And Disbursement`, `Payment Upon Loan Repayment`, `Payment Upon Delayed Repayment`) |
| Stages | `KYC & Documentation`, `Guarantor & Collateral`, `Eligibility & Credit Verification`, `Sanctions & Approval`, each with `Default Role` and `Default Assignee` |
| Accounting | `Loan Portfolio Account`, `Accrued Account`, `Income From Interest`, `Expenses Losses Written Off`, `Overpayment Account`, `Loan Suspense Account` — mapped to concrete codes: `1201`, `1505`, `4001`, `5004`, `(overpayment)`, `1206` |

**Savings product** — `Name*`, `Description`, `Minimum Balance`,
`Maximum Transaction Amount*`, `Allowed As Guarantor`, `Allowed As Collateral`,
`Allowed Multiple Accounts`, `Allow Interest Payout`, `Interest Payout Account Name`,
`Interest Payout General Ledger Code*`, `Default Auto Debit Account`, `Type*`
(e.g. `Primary`), `Minimum Transaction Amount*`, `Permission`, `General Ledger Code*`,
and a charge table (`Charge Name`, `Transaction Type`, `Component Type`, `Occurance`,
`Charge Fee Type`, `Add Charge`).

**Interest Rate** — `Name*`, `Frequency Type*`, `Frequency*`, `Interest Rate Type*`
(`Fixed` / `Variable`), `Rate Of Interest*`, `Start Date*`, `End Date*`, `Description`.

**Fee & Penalties** — reusable charge definitions consumed by products.

**Loan Provisioning** — provisioning rules per product (rate by days-past-due bucket).

### 12.5 Policies

**Membership Policy** — `Name`, `Description`, `Member Type` (Individual/Group),
`Minimum Next of Kin` (1), `Maximum Next of Kin` (2), `Dormant Days` (365),
`Allow Withdraw` (Yes), `Auto Active Upon Deposit` (Yes), `Enable Member Verification`,
`Verification Type` (`Manual`), plus an **approval list** with `Assigned To`, `Board Member`,
`Policy Approval Status` (`In Progress`), `Comment`, `Action Date`, `Resubmitted`.

**Credit Product Policy** — a versioned, approvable copy of the loan product terms:
`Product`, `Loan Type`, `Status` (`Approved`), and read-only mirrors of Terms / Interest /
Repayments / Guarantors / Charges / Stages / Accounting, plus the same board-approval list.

> Policy vs Product is a **four-eyes versioning pattern**: the product is the live
> configuration; the policy is the approved snapshot with a signature trail. Loans store the
> policy version they were priced under — visible as `Product Policy Version` on the loan
> summary. Preserve that link; it is an audit requirement.

**Holidays** — calendar used by arrears and branch hours.

### 12.6 Users

`User Management`: `+ New User`, search, filters. Columns `Email Address`, `Full Name`,
`Phone Number`, `Status` (Active/Inactive/Pending), `Role Name` (comma-separated, multi-role).
18 users observed.

### 12.7 Roles

17 roles, each with a permission matrix of `Entity : Action` strings (see
`01-system-overview.md §3.2`). Five screenshots of this screen — it is the densest
configuration UI after the loan product.

### 12.8 Services

`Services` screen captured but empty. Name suggests third-party providers
(payment/SMS/CRB). **Treat as unbuilt/unknown**; design the integration registry so it can
be filled in.

---

## 13. Screen count by module

| Module | Distinct routes | Share |
|---|---|---|
| Reports (operational + regulatory) | 53 | 37% |
| Accounting | 23 | 16% |
| Settings | 24 | 17% |
| Accounts (loans + savings) | 15 | 10% |
| Client | 4 | 3% |
| Transactions | 6 | 4% |
| Import | 6 | 4% |
| Messages | 8 | 6% |
| Requests | 1 | 1% |
| Business Account | 1 | 1% |
| Dashboard / Campaigns | 2 | 1% |

Reports and configuration are **half the product**. Plan the delivery order accordingly:
a reporting engine and a product-configuration engine are not afterthoughts.
