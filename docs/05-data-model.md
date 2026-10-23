# 05 — Data Model

Five ERDs, then the entity dictionary, enums, numbering rules and constraints.

Conventions used throughout:

- every business table carries `tenant_id` (omitted from the diagrams for readability),
- money is `NUMERIC(18,2)`, never floating point,
- timestamps are `TIMESTAMPTZ` in UTC; business dates are `DATE` in Africa/Dar_es_Salaam,
- primary keys are UUIDs; account/entry numbers are separate human-readable business keys,
- deletes are soft (`deleted_at`) except in the ledger, which never deletes.

---

## 1. Party, membership and KYC

```mermaid
erDiagram
    TENANT ||--o{ BRANCH : operates
    TENANT ||--o{ USER : employs
    TENANT ||--o{ MEMBERSHIP_POLICY : defines
    BRANCH ||--o{ CLIENT : serves
    BRANCH ||--o{ BRANCH_HOURS : has
    BRANCH ||--o{ HOLIDAY : observes

    CLIENT ||--o{ GROUP_MEMBER : contains
    CLIENT ||--o{ CLIENT_USER : grants
    CLIENT ||--o{ KYC_DOCUMENT : holds
    CLIENT ||--o{ NEXT_OF_KIN : nominates
    CLIENT ||--o{ INCOME_RECORD : earns
    CLIENT ||--o{ RESIDENCE : lives
    CLIENT ||--o{ CLIENT_ASSET : owns
    CLIENT ||--o{ BANK_ACCOUNT : banks
    CLIENT ||--o{ MNO_ACCOUNT : wallets

    USER }o--o{ ROLE : assigned
    ROLE ||--o{ ROLE_PERMISSION : grants
    PERMISSION ||--o{ ROLE_PERMISSION : in

    CLIENT {
        uuid id PK
        uuid tenant_id FK
        uuid branch_id FK
        uuid policy_id FK
        string member_id UK
        string client_type
        string display_name
        string status
        uuid client_manager_id FK
        uuid parent_group_id FK
        date joined_on
        int dormant_days
        string national_id
        string tin
        string phone
        string email
        boolean is_disabled
        string impairment_type
        int dependents
    }

    GROUP_MEMBER {
        uuid id PK
        uuid group_id FK
        uuid client_id FK
        string member_type
        date joined_on
        boolean active
    }

    KYC_DOCUMENT {
        uuid id PK
        uuid client_id FK
        string document_type
        string storage_key
        string status
        date uploaded_on
        uuid approved_by FK
        string comments
    }

    NEXT_OF_KIN {
        uuid id PK
        uuid client_id FK
        string full_name
        string relation
        date dob
        string national_id
        string tin
        decimal percentage
    }

    CLIENT_ASSET {
        uuid id PK
        uuid client_id FK
        string asset_type
        decimal value
        string location
        string comments
    }

    BANK_ACCOUNT {
        uuid id PK
        uuid client_id FK
        string bank_name
        string account_number
        string swift_bic
        boolean primary
    }

    MNO_ACCOUNT {
        uuid id PK
        uuid client_id FK
        string provider
        string msisdn
        boolean active
    }

    MEMBERSHIP_POLICY {
        uuid id PK
        uuid tenant_id FK
        string name
        string member_type
        int min_next_of_kin
        int max_next_of_kin
        int dormant_days
        boolean allow_withdraw
        boolean auto_active_on_deposit
        boolean verification_required
        string verification_type
        string status
        int version
    }
```

**Rules**

- `CLIENT` is a single table holding both individuals and groups (`client_type =
  INDIVIDUAL | GROUP`). A group is a counterparty; `GROUP_MEMBER` is a roster, not a set of
  separate clients.
- `member_id` is unique per tenant and immutable. Never reuse a deleted member's number.
- `NEXT_OF_KIN.percentage` must sum to 100 per client — enforce with a deferred constraint or
  a domain check at save.
- `CLIENT.status ∈ {Pending, Active, Dormant, Inactive, Rejected}`.
- KYC documents live in object storage; only `storage_key` is in the database.

---

## 2. Products, policies and configuration

```mermaid
erDiagram
    TENANT ||--o{ LOAN_PRODUCT : offers
    TENANT ||--o{ SAVINGS_PRODUCT : offers
    TENANT ||--o{ CHARGE_DEFINITION : defines

    LOAN_PRODUCT ||--o{ PRODUCT_CHARGE : prices
    CHARGE_DEFINITION ||--o{ PRODUCT_CHARGE : used_in
    LOAN_PRODUCT ||--o{ PROVISIONING_RULE : classifies
    LOAN_PRODUCT ||--o{ PRODUCT_STAGE : requires
    LOAN_PRODUCT ||--o{ PRODUCT_ACCOUNT_MAP : posts_to

    LOAN_PRODUCT ||--o{ CREDIT_POLICY_VERSION : snapshots
    CREDIT_POLICY_VERSION ||--o{ POLICY_APPROVAL : signed_by
    MEMBERSHIP_POLICY ||--o{ POLICY_APPROVAL : signed_by

    SAVINGS_PRODUCT ||--o{ SAVINGS_PRODUCT_CHARGE : prices

    LOAN_PRODUCT {
        uuid id PK
        uuid tenant_id FK
        string name
        string loan_type
        string status
        decimal min_amount
        decimal max_amount
        int min_tenure_months
        int max_tenure_months
        int grace_period
        string interest_method
        decimal nominal_rate
        string rate_period
        string accrual_type
        string accrual_term
        string repayment_strategy
        string advance_adjustment
        int days_before_npa
        int grace_before_arrears
        boolean exclude_holidays
        boolean allow_tranches
        boolean allow_multiple_loans
        boolean quick_loan
        decimal multiplier_savings
        decimal multiplier_shares
        decimal collateral_ratio
        int min_guarantors
        boolean active
        int version
    }

    PRODUCT_STAGE {
        uuid id PK
        uuid product_id FK
        int seq
        string name
        uuid default_role_id FK
        uuid default_assignee_id FK
        boolean optional
    }

    PRODUCT_ACCOUNT_MAP {
        uuid id PK
        uuid product_id FK
        string purpose
        uuid gl_account_id FK
    }

    CREDIT_POLICY_VERSION {
        uuid id PK
        uuid product_id FK
        int version
        jsonb terms
        string status
        date effective_from
        uuid approved_by FK
        timestamptz approved_at
    }

    PROVISIONING_RULE {
        uuid id PK
        uuid product_id FK
        int days_from
        int days_to
        string classification
        decimal provision_rate
        uuid expense_account_id FK
        uuid provision_account_id FK
    }

    CHARGE_DEFINITION {
        uuid id PK
        uuid tenant_id FK
        string name
        string fee_type
        decimal value
        string component
        string payment_mode
        string frequency
        boolean active
    }
```

**Rules**

- `PRODUCT_ACCOUNT_MAP.purpose ∈ {LoanPortfolio, Accrued, InterestIncome,
  LossesWrittenOff, Overpayment, LoanSuspense}` — exactly the six observed mappings.
- `CREDIT_POLICY_VERSION` is immutable once `Approved`. Loans store `policy_version_id`.
- `PROVISIONING_RULE` overlaps are forbidden; validate at save.
- Deleting a product is forbidden if any account references it; deactivate instead.

---

## 3. Savings, credit and servicing

```mermaid
erDiagram
    CLIENT ||--o{ SAVINGS_ACCOUNT : owns
    CLIENT ||--o{ SHARE_ACCOUNT : holds
    SAVINGS_PRODUCT ||--o{ SAVINGS_ACCOUNT : types
    SAVINGS_ACCOUNT ||--o{ SAVINGS_TXN : records
    SAVINGS_ACCOUNT ||--o{ RESERVATION : blocks

    CLIENT ||--o{ LOAN_APPLICATION : applies
    LOAN_PRODUCT ||--o{ LOAN_APPLICATION : priced_by
    LOAN_APPLICATION ||--o{ APPLICATION_STAGE : progresses
    APPLICATION_STAGE ||--o{ APPROVAL : decides
    LOAN_APPLICATION ||--|| LOAN : becomes

    LOAN ||--o{ SCHEDULE_LINE : schedules
    LOAN ||--o{ REPAYMENT : receives
    LOAN ||--o{ GUARANTOR : secured_by
    LOAN ||--o{ COLLATERAL : pledged
    LOAN ||--o{ LOAN_CHARGE : charges
    LOAN ||--o{ LOAN_EVENT : logs
    GUARANTOR ||--o| RESERVATION : blocks

    SAVINGS_ACCOUNT ||--o{ TRANSACTION : sources
    LOAN ||--o{ TRANSACTION : sources

    SAVINGS_ACCOUNT {
        uuid id PK
        uuid tenant_id FK
        uuid branch_id FK
        uuid client_id FK
        uuid product_id FK
        string account_number UK
        string account_name
        string account_type
        decimal balance
        decimal reserved
        string status
        date opened_on
        date closed_on
    }

    RESERVATION {
        uuid id PK
        uuid savings_account_id FK
        uuid loan_id FK
        string reason
        decimal amount
        string status
        timestamptz released_at
    }

    LOAN_APPLICATION {
        uuid id PK
        uuid tenant_id FK
        uuid branch_id FK
        uuid client_id FK
        uuid product_id FK
        uuid policy_version_id FK
        string application_no UK
        decimal requested_amount
        int tenure
        string tenure_period
        decimal interest_rate
        string interest_method
        decimal debt_capacity
        string economic_sector
        string sub_sector
        string sub_sub_sector
        int crb_score
        uuid loan_officer_id FK
        string status
        timestamptz submitted_at
    }

    LOAN {
        uuid id PK
        uuid tenant_id FK
        uuid branch_id FK
        uuid client_id FK
        uuid application_id FK
        uuid product_id FK
        uuid policy_version_id FK
        string loan_number UK
        string account_number UK
        decimal principal
        decimal disbursed_amount
        decimal interest_rate
        string interest_method
        date disbursed_on
        date first_due_on
        date maturity_on
        decimal outstanding_principal
        decimal outstanding_interest
        decimal outstanding_charges
        decimal arrears_amount
        int days_past_due
        string classification
        string status
        boolean is_insider
        string provisioning_status
    }

    SCHEDULE_LINE {
        uuid id PK
        uuid loan_id FK
        int installment_no
        date due_date
        decimal principal_due
        decimal interest_due
        decimal charges_due
        decimal penalty_due
        decimal total_due
        decimal principal_paid
        decimal interest_paid
        decimal charges_paid
        decimal penalty_paid
        string status
    }

    GUARANTOR {
        uuid id PK
        uuid loan_id FK
        uuid guarantor_client_id FK
        string guarantor_type
        decimal block_amount
        decimal percentage
        decimal blocked_fund
        string guarantee_type
        string status
    }

    COLLATERAL {
        uuid id PK
        uuid loan_id FK
        uuid client_asset_id FK
        string asset_name
        string asset_type
        decimal valuation
        decimal block_amount
        decimal collateral_ratio
        string document_key
    }

    LOAN_EVENT {
        uuid id PK
        uuid loan_id FK
        string event_type
        jsonb before_state
        jsonb after_state
        uuid actor_id FK
        timestamptz occurred_at
        string note
    }
```

**Rules**

- `SAVINGS_ACCOUNT.available = balance − reserved`, computed and never stored as a separate
  mutable field without a reconciliation job.
- `RESERVATION.status ∈ {Active, Released, Consumed}`; release is idempotent on `id`.
- One `LOAN` per `LOAN_APPLICATION`; reapplication creates a new application.
- `SCHEDULE_LINE` is replaced, not mutated, on reschedule — old rows are archived with a
  `schedule_version`.
- `GUARANTOR.blocked_fund` must equal the linked `RESERVATION.amount` at all times.
- `LOAN.classification ∈ {Performing, Watch, Substandard, Doubtful, Loss}` recomputed nightly.

---

## 4. Ledger and posting

```mermaid
erDiagram
    TENANT ||--o{ PERIOD : closes
    GL_GROUP ||--o{ GL_ACCOUNT : groups
    GL_CATEGORY ||--o{ GL_CATEGORY : parents
    GL_ACCOUNT }o--|| GL_GROUP : in
    GL_ACCOUNT }o--o| GL_CATEGORY : maps

    PERIOD ||--o{ JOURNAL_ENTRY : contains
    JOURNAL_ENTRY ||--|{ JOURNAL_LINE : balances
    GL_ACCOUNT ||--o{ JOURNAL_LINE : posts

    POSTING_RULE }o--|| GL_ACCOUNT : debit
    POSTING_RULE }o--|| GL_ACCOUNT : credit
    OUTBOX_EVENT ||--o| JOURNAL_ENTRY : produces

    GL_ACCOUNT {
        uuid id PK
        uuid tenant_id FK
        uuid branch_id FK
        string code UK
        string name
        string account_class
        uuid group_id FK
        uuid parent_id FK
        boolean is_bank_or_cash
        boolean requires_reconciliation
        boolean is_control
        decimal opening_balance
        date opening_date
        string internal_account_no
        boolean active
    }

    PERIOD {
        uuid id PK
        uuid tenant_id FK
        int fiscal_year
        int month
        date starts_on
        date ends_on
        string status
        uuid closed_by FK
        timestamptz closed_at
    }

    JOURNAL_ENTRY {
        uuid id PK
        uuid tenant_id FK
        uuid branch_id FK
        uuid period_id FK
        string entry_no UK
        date entry_date
        string entry_type
        string status
        string source_type
        uuid source_id
        string idempotency_key UK
        string narration
        string comment
        uuid reversed_entry_id FK
        uuid created_by FK
        timestamptz posted_at
    }

    JOURNAL_LINE {
        uuid id PK
        uuid entry_id FK
        int line_no
        uuid gl_account_id FK
        string dr_cr
        decimal amount
        uuid member_id FK
        uuid loan_id FK
    }

    POSTING_RULE {
        uuid id PK
        uuid tenant_id FK
        string event_type
        string product_type
        uuid product_id FK
        uuid debit_account_id FK
        uuid credit_account_id FK
        string amount_selector
        int priority
        boolean active
    }

    OUTBOX_EVENT {
        uuid id PK
        uuid tenant_id FK
        string event_type
        string aggregate_type
        uuid aggregate_id
        jsonb payload
        string status
        int attempts
        string last_error
        timestamptz available_at
        timestamptz processed_at
    }
```

**Rules**

- `journal_line.dr_cr ∈ {D, C}`; `SUM(amount where D) = SUM(amount where C)` per entry.
- `journal_entry.idempotency_key` is globally unique per tenant. This single constraint is
  what makes resubmission safe.
- `period.status ∈ {Open, Closing, Closed, Locked}`; posting requires `Open`.
- `entry_no` scheme observed: `31953200001057`, `30953200001054` — a prefix plus a sequence.
- `GL_ACCOUNT.is_control = true` means a sub-ledger must exist for the line; do not allow
  direct manual posting.
- A reversal is a new entry with `reversed_entry_id` pointing at the original; the original's
  `status` becomes `Reversed`.

---

## 5. Operations: teller, requests, messaging, import, billing

```mermaid
erDiagram
    BRANCH ||--o{ TILL_SESSION : runs
    USER ||--o{ TILL_SESSION : operates
    TILL_SESSION ||--o{ DENOMINATION : counts
    TILL_SESSION ||--o{ TRANSACTION : records

    REQUEST ||--o{ APPROVAL : decided
    USER ||--o{ REQUEST : raises
    USER ||--o{ APPROVAL : decides

    SEGMENT ||--o{ MESSAGE_LOG : targets
    MESSAGE_TEMPLATE ||--o{ MESSAGE_LOG : renders
    SEGMENT }o--o{ CLIENT : includes

    IMPORT_BATCH ||--o{ IMPORT_ROW : contains
    IMPORT_BATCH ||--o{ FIELD_MAPPING : uses

    WBA_WALLET ||--o{ WBA_INVOICE : billed
    WBA_WALLET ||--o{ WBA_SETTLEMENT : settles

    TILL_SESSION {
        uuid id PK
        uuid tenant_id FK
        uuid branch_id FK
        uuid teller_id FK
        uuid gl_account_id FK
        date business_date
        decimal opening_float
        decimal closing_counted
        decimal system_balance
        decimal variance
        string status
        timestamptz opened_at
        timestamptz closed_at
    }

    TRANSACTION {
        uuid id PK
        uuid tenant_id FK
        uuid branch_id FK
        uuid till_session_id FK
        string transaction_no UK
        string type
        string category
        uuid client_id FK
        uuid savings_account_id FK
        uuid loan_id FK
        decimal amount
        string dr_cr
        string payment_method
        date value_date
        string cheque_no
        string receipt_no
        string external_ref
        string provider
        string status
        string accounting_status
        string idempotency_key UK
        uuid created_by FK
        uuid approved_by FK
        uuid reversed_by FK
    }

    REQUEST {
        uuid id PK
        uuid tenant_id FK
        uuid branch_id FK
        string request_type
        jsonb payload
        decimal amount
        string status
        uuid current_assignee_id FK
        uuid requested_by FK
        uuid approved_by FK
        timestamptz approved_at
        string reason
    }

    MESSAGE_TEMPLATE {
        uuid id PK
        uuid tenant_id FK
        string name
        string template_key
        string type
        string language
        string subject
        text body
        int version
        boolean enabled
    }

    MESSAGE_LOG {
        uuid id PK
        uuid tenant_id FK
        uuid template_id FK
        uuid segment_id FK
        string recipient
        string channel
        string status
        string failure_reason
        int credits_used
        timestamptz sent_at
    }

    IMPORT_BATCH {
        uuid id PK
        uuid tenant_id FK
        string import_type
        string file_key
        string file_name
        string batch_ref
        string status
        int total_rows
        int success_rows
        int failed_rows
        uuid uploaded_by FK
        timestamptz created_at
    }

    WBA_WALLET {
        uuid id PK
        uuid tenant_id FK
        decimal balance
        decimal pending_settlement
        decimal due_amount
        string status
        string currency
    }

    WBA_INVOICE {
        uuid id PK
        uuid wallet_id FK
        string invoice_no UK
        date period_start
        date period_end
        decimal amount
        decimal discount
        string status
        date due_date
    }
```

**Rules**

- One `TILL_SESSION` with `status = Open` per teller per branch. Enforce with a partial unique
  index.
- `TRANSACTION.status` and `TRANSACTION.accounting_status` are independent (see
  `03-flows.md §8`).
- `REQUEST` is polymorphic by `request_type` + `payload`; every type also gets an `APPROVAL`
  row so the audit timeline is uniform.
- `MESSAGE_LOG.credits_used` reconciles against the WBA wallet and the credit balance.
- `IMPORT_BATCH` is all-or-nothing at commit unless the tenant opts into chunked mode.

---

## 6. Entity dictionary — decision-critical columns

### Client

| Column | Type | Notes |
|---|---|---|
| `member_id` | text | `9532002xxx`; generated, immutable, unique per tenant |
| `client_type` | enum | `INDIVIDUAL`, `GROUP` |
| `status` | enum | `Pending`, `Active`, `Dormant`, `Inactive`, `Rejected` |
| `client_manager_id` | uuid | Relationship owner; drives portfolio reports |
| `parent_group_id` | uuid | Group membership for an individual |
| `national_id` | text | Unique per tenant when present; used for online payment matching |
| `dormant_days` | int | Copied from policy at activation (365 observed) |
| `is_disabled` / `impairment_type` | bool / text | Regulatory reporting dimension |

### Loan

| Column | Type | Notes |
|---|---|---|
| `account_number` | text | `95323000xxx` |
| `outstanding_principal` | numeric | Maintained by schedule updates + nightly reconciliation |
| `days_past_due` | int | Recompute nightly; excludes holidays when product says so |
| `classification` | enum | Provisioning bucket |
| `policy_version_id` | uuid | Audit-critical; never null |
| `is_insider` | bool | MSP06 insider-lending return |

### Journal entry

| Column | Type | Notes |
|---|---|---|
| `idempotency_key` | text | Unique; source of resubmission safety |
| `source_type` / `source_id` | text / uuid | Which operational document caused this |
| `entry_type` | enum | `Receipt`, `Payment`, `Journal` (observed) |
| `status` | enum | `Posted`, `Reversed`, `Archived` |

### Savings account

| Column | Type | Notes |
|---|---|---|
| `balance` | numeric | Ledger-backed |
| `reserved` | numeric | Sum of active reservations; guarantee blocking |
| `account_type` | enum | `Primary`, product-defined |
| `account_number` | text | Members also hold a shorter share/savings suffix |

---

## 7. Enumerations (canonical)

```
ClientType          INDIVIDUAL | GROUP
ClientStatus        Pending | Active | Dormant | Inactive | Rejected
MembershipPolicyStatus  Draft | In Progress | Resubmitted | Approved | Rejected

LoanStatus          Draft | Submitted | InReview | Approved | Disbursed | Active
                    | Delinquent | NPA | Rescheduled | Closed | WrittenOff | Rejected
ApplicationStageStatus  Pending | Approved | Rejected | Skipped
InterestMethod      ReducingBalanceEqualInstallment | ReducingBalanceEqualPrincipal
                    | StraightLine | Balloon | InterestOnly
AccrualType         Accrual | Cash
AccrualTerm         OnDueDate | Daily
RepaymentStrategy   ChargesInterestPrincipal | InterestPrincipalCharges | ...
Classification      Performing | Watch | Substandard | Doubtful | Loss

SavingsAccountStatus  Active | Dormant | Closed | Frozen
ReservationStatus     Active | Released | Consumed
ReservationReason     Guarantee | Collateral | Lien | MinimumBalance

TransactionCategory   Client | GeneralLedger | Till | Bulk
TransactionStatus     Submitted | Approved | Rejected | Reversed | Cancelled
AccountingStatus      Pending | Posted | Failed

EntryType           Receipt | Payment | Journal
EntryStatus         Posted | Reversed | Archived
PeriodStatus        Open | Closing | Closed | Locked

RequestStatus       Pending | Approved | Rejected | Cancelled
MessageChannel      SMS | Email | Push
MessageType         Transactional | Marketing | Notification
MessageStatus       Queued | Sent | Delivered | Failed

ImportStatus        Uploaded | Mapping | Validating | Committed | Failed | RolledBack
WalletStatus        Active | Low | Suspended
InvoiceStatus       Draft | Issued | Paid | Overdue | Void
```

---

## 8. Numbering and identifiers

| Object | Pattern | Example |
|---|---|---|
| Client / member | `9532` + `002` + seq | `9532002374` |
| Loan account | `95323` + seq | `953230000172` |
| Internal / GL account | `95329` + seq | `953290000041` |
| Ledger code | 4-digit class + seq | `1201`, `4005`, `5502` |
| Journal entry | prefix + seq | `31953200001057` |
| Transaction | prefix + seq | `30953200001027` |
| Fee/expense txn | `509532…` / `309532…` | observed in Fees Income / Expense reports |
| WBA invoice | `TZ-` + seq | `TZ-001045` |
| Loan number (per branch) | seq | `91`, `118` |
| Import batch | generated ref | `N/A` when absent |

Sequences must be **per tenant** and allocated transactionally. Gaps are acceptable; reuse is
not.

---

## 9. Indexing and performance

Minimum index set (beyond primary keys):

```sql
-- tenant scoping on everything hot
(tenant_id, branch_id, created_at DESC)

-- client lookup by business id and identity
UNIQUE (tenant_id, member_id)
        (tenant_id, national_id) WHERE national_id IS NOT NULL
        (tenant_id, phone)

-- loan servicing
(tenant_id, status, maturity_on)
        (tenant_id, loan_officer_id)
        (tenant_id, days_past_due) WHERE status IN ('Active','Delinquent','NPA')
UNIQUE  (loan_id, schedule_version, installment_no)

-- savings
UNIQUE  (tenant_id, account_number)
        (savings_account_id, created_at DESC)

-- transactions
UNIQUE  (tenant_id, transaction_no)
UNIQUE  (tenant_id, idempotency_key)
        (tenant_id, accounting_status) WHERE accounting_status <> 'Posted'
        (tenant_id, value_date, type)

-- ledger
UNIQUE  (tenant_id, entry_no)
        (tenant_id, period_id, entry_date)
        (gl_account_id, entry_date)
UNIQUE  (tenant_id, idempotency_key)

-- reports
        (tenant_id, branch_id, disbursed_on)
        (tenant_id, product_id, classification)
```

Partition `journal_line` and `transaction` by month once a tenant exceeds ~5 million rows.

---

## 10. Integrity constraints worth writing down

1. `journal_entry` balance: deferred constraint trigger asserting Dr = Cr.
2. `journal_line` amount > 0 (direction is carried by `dr_cr`).
3. `schedule_line`: `principal_due >= 0`, paid ≤ due per component.
4. `loan`: `SUM(schedule.principal_due) = disbursed_amount` per active schedule version.
5. `savings_account`: `reserved >= 0` and `balance >= 0` unless product allows overdraft.
6. `guarantor`: `SUM(block_amount) <= loan.principal` (product policy may be stricter).
7. `reservation`: one active reservation per (`loan_id`, `savings_account_id`).
8. `till_session`: at most one `Open` per (`teller_id`, `business_date`).
9. `next_of_kin`: `SUM(percentage) = 100` per client.
10. `period`: no `journal_entry` with `entry_date` outside an `Open` period.
11. `approval`: no duplicate (`stage_id`, `decided_by`) — prevents double approval.
12. `client`: `status = Active` requires at least one KYC document when policy requires
    verification.
