# 03 — Core Flows

Eleven flows carry the system. Each is given as a Mermaid diagram plus the **rules you must
implement** — the diagram shows the happy path, the rules show what breaks in production.

---

## 1. End-to-end value chain

```mermaid
flowchart LR
    subgraph A["Acquire"]
        A1["Member / group<br/>onboarding"] --> A2["KYC<br/>verification"]
    end
    subgraph B["Fund"]
        B1["Savings &<br/>share capital"] --> B2["Deposits<br/>(teller, online, bulk)"]
    end
    subgraph C["Lend"]
        C1["Application"] --> C2["4-stage<br/>approval"] --> C3["Disbursement"] --> C4["Repayment<br/>& arrears"]
    end
    subgraph D["Account"]
        D1["Double-entry<br/>posting"] --> D2["Period close"] --> D3["Financial<br/>statements"]
    end
    subgraph E["Report"]
        E1["Management<br/>reports"] --> E2["Regulatory<br/>returns"] --> E3["Audit trail"]
    end
    A2 --> B1
    B1 --> C1
    C4 --> B1
    C3 --> D1
    B2 --> D1
    C4 --> D1
    D3 --> E1
```

**Rule.** The loop `C4 → B1 → C1` is the business: savings fund loans, repayments refill
savings. Any design that treats savings and credit as separate systems will fail at
guarantor blocking and at repayment allocation.

---

## 2. Member onboarding (individual)

```mermaid
flowchart TD
    S(["Client Manager<br/>starts Add Client"]) --> P["Select membership policy<br/>(Individual)"]
    P --> M["Membership details<br/>policy, branch, joining date,<br/>client manager, group"]
    M --> PD["Personal details<br/>names, gender, DOB, marital status,<br/>dependents, disability"]
    PD --> CD["Contact details<br/>phone, email, address,<br/>region, district, ward"]
    CD --> ID["Identity<br/>National ID, TIN,<br/>document upload"]
    ID --> RES["Residence<br/>one or more addresses"]
    RES --> EMP["Employment or business<br/>income, BRELA, licence, TIN"]
    EMP --> NOK["Next of kin<br/>1 to 2 nominees<br/>with percentages"]
    NOK --> V{"Validate"}
    V -->|"incomplete"| PD
    V -->|"valid"| SAVE["Persist member<br/>status = Pending"]
    SAVE --> KYC{"Policy requires<br/>verification?"}
    KYC -->|"No"| ACT["Status = Active<br/>account numbers issued"]
    KYC -->|"Yes, Manual"| REV["KYC review queue"]
    KYC -->|"Yes, Automatic"| EXT["External identity check"]
    REV --> DEC{"Approved?"}
    EXT --> DEC
    DEC -->|"Yes"| ACT
    DEC -->|"No"| REJ["Status = Rejected<br/>reason recorded"]
    ACT --> NUM["Assign Member Id 9532002xxx<br/>open savings + share accounts"]
    NUM --> PORTAL["Invite users<br/>owner / delegate roles"]
```

**Rules**

1. **Nominee percentages must total 100.** The membership policy allows 1–2 nominees.
2. **Member Id is generated, never entered.** Observed scheme: `9532002xxx`; loans
   `95323000xxx`; internal/GL `95329000xxx`.
3. **Dormancy** — 365 days without activity makes a member dormant; `Auto Active Upon
   Deposit = Yes` reactivates them on the next deposit.
4. **`Allow Withdraw = Yes`** on the policy controls whether savings can be withdrawn at all,
   independent of balance.
5. Group members are **not** independent clients — they are roster rows on the group, with a
   `Group Member Type` (chairperson, secretary, committee, ordinary).
6. KYC documents are capped at **5 MB** each and stored by reference, never in the database.

---

## 3. Group onboarding and member roster

```mermaid
flowchart TD
    S(["Add Group"]) --> MD["Membership details<br/>GROUP POLICY, relationship manager,<br/>joining date"]
    MD --> GD["Group details<br/>name, code, type, branch,<br/>parent group, address"]
    GD --> MS["Meeting schedule<br/>day, frequency, recurrence day/date"]
    MS --> SAVE["Create group<br/>Member Id + Group profile"]
    SAVE --> ROSTER["Add group members<br/>name, phone, member type"]
    ROSTER --> USERS["Invite portal users<br/>role: Owner / delegate"]
    USERS --> ACT["Activate Business Account<br/>(optional WBA linkage)"]
    ROSTER --> LEND["New loan application<br/>against the group"]
    ROSTER --> SAVE2["Add saving / add share"]
```

**Rules**

1. A group is a **single credit counterparty** in this product: loans are booked to the group,
   and the roster is evidence of membership, not a set of borrowers.
2. Group loans still require guarantors per product policy (`Minimum Number Of Guarantors`).
3. Group meeting schedule feeds collection scheduling and SMS reminders.

---

## 4. Loan lifecycle — state machine

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Draft
    Draft --> Submitted : submit application
    Submitted --> Stage1 : route to first stage
    state "Stage 1 · KYC & Documentation" as Stage1
    Stage1 --> Stage2 : approve
    Stage1 --> Rejected : reject
    state "Stage 2 · Guarantor & Collateral" as Stage2
    Stage2 --> Stage3 : approve
    Stage2 --> Rejected : reject
    state "Stage 3 · Eligibility & Credit Verification" as Stage3
    Stage3 --> Stage4 : approve
    Stage3 --> Rejected : reject
    state "Stage 4 · Sanctions & Approval" as Stage4
    Stage4 --> Approved : sanction
    Stage4 --> Rejected : decline
    Approved --> Disbursed : disburse
    Disbursed --> Active : first schedule issued
    Active --> Delinquent : installment overdue beyond grace
    Delinquent --> Active : arrears cured
    Delinquent --> NPA : days past due over threshold
    NPA --> Active : recovered
    NPA --> WrittenOff : write off approved
    Active --> Rescheduled : reschedule approved
    Rescheduled --> Active : new schedule issued
    Active --> Closed : fully paid
    Closed --> [*]
    WrittenOff --> [*]
    Rejected --> [*]
```

**Rules**

1. **Four sequential stages, each with a default role and assignee** copied from the product
   at submission time (not at approval time — policies change).
2. **Editing is only allowed before the first approval.** After that, changes require
   resubmission and invalidate prior approvals.
3. **Rejection at any stage is terminal for that application**; the member reapplies.
4. **An optional `Fee & Payments` stage** exists between sanction and disbursement for
   products that charge upfront.
5. **`Product Policy Version` is stamped on the loan.** A later policy edit must not
   retroactively change a booked loan.
6. **Disbursement is the accounting event**, not approval. Approval creates intent;
   disbursement moves money and books the entry.
7. **Top-up, reschedule, write-off, interest waiver and close are separate commands**, each
   with its own approval and its own ledger effect. Do not implement them as field edits.

---

## 5. Loan application — approval sequence

```mermaid
sequenceDiagram
    autonumber
    actor LO as Loan Officer
    participant UI as CAMS Admin
    participant API as Application API
    participant WF as Workflow
    participant S1 as KYC Officer
    participant S2 as Credit Officer
    participant S3 as Credit Committee
    participant S4 as Managing Director
    participant LED as Ledger
    participant MSG as Messaging

    LO->>UI: New application (client, product, principal, tenure, sector)
    UI->>API: POST /loan-applications
    API->>API: validate limits, debt capacity, product policy
    API->>WF: create case (4 stages, roles resolved from policy)
    WF-->>API: case id + stage 1 assignee
    API->>MSG: notify stage 1
    API-->>UI: 201 Created (status Submitted)

    S1->>UI: review KYC + documents
    S1->>API: approve(stage 1, note, score)
    API->>WF: advance
    WF->>S2: assign stage 2
    Note over S2: Guarantor & Collateral —<br/>block funds, value collateral
    S2->>API: approve(stage 2)
    API->>WF: advance
    WF->>S3: assign stage 3
    Note over S3: Eligibility & Credit Verification —<br/>CRB score 500-800, insider check
    S3->>API: approve(stage 3)
    API->>WF: advance
    WF->>S4: assign stage 4
    S4->>API: sanction(stage 4)
    API->>API: status = Approved

    LO->>UI: Disburse
    UI->>API: POST /loans/{id}/disburse
    API->>API: generate schedule, apply charges
    API->>LED: post DR Loan Portfolio / CR Cash or Bank
    LED-->>API: entry posted
    API->>MSG: notify member (LoanDisbursedMessage)
    API-->>UI: disbursed, schedule available
```

**Rules**

1. **Each stage records:** approver, role, decision, note, score, timestamp, and the exact
   policy version used. The UI shows `Pending / Approved`, `Previous Step / Current Step`,
   `Approval history`, `Notes`, `Score history`, `Audit history`, `Documents`.
2. **The same user may not approve two consecutive stages** of one loan (segregation of duties).
3. **Guarantor blocking happens at stage 2**, before sanction — otherwise you sanction a loan
   with no cover.
4. **Charges are created at disbursement** per `Payment Mode`:
   `Payment Upon Processing And Disbursement` (e.g. 5% loan management fee),
   `Payment Upon Loan Repayment`, `Payment Upon Delayed Repayment` (penalty 0.5% of current due).
5. **Notification templates exist for the lifecycle:** `LoanDisbursedMessage`,
   `LoanRepaymentMessage`, `LoanRepaymentAdminMessage`, `LoanDisbursedWithFeeMessages`.

---

## 6. Guarantor blocking and release

```mermaid
sequenceDiagram
    autonumber
    actor CO as Credit Officer
    participant UI as CAMS Admin
    participant CR as Credit service
    participant SV as Savings service
    participant LED as Ledger

    CO->>UI: add guarantor (member, block amount, percentage)
    UI->>CR: attachGuarantor(loanId, memberId, amount, percent)
    CR->>CR: check guarantor has no NPA loan
    CR->>SV: reserve(memberAccount, amount, reason=guarantee)
    SV->>SV: reduce available, increase reserved
    SV-->>CR: reservation id
    CR-->>UI: guarantor attached, funds blocked

    Note over CR,SV: On disbursement the reservation becomes encumbrance

    CR->>LED: optional reclass of blocked fund to guarantee ledger
    Note over CR,LED: On repayment / cancellation / write-off
    CR->>SV: release(reservationId)
    SV->>SV: increase available, reduce reserved
```

**Rules**

1. **Blocked funds are not a display concept.** They reduce withdrawable balance; the member
   statement shows `Blocked Fund`.
2. **Release must be exactly-once.** Key releases off the reservation id, not off loan status.
3. A guarantor with an NPA loan cannot guarantee (the credit screen shows
   `Insider Relationship` and risk flags for exactly this reason).
4. `Collateral Ratio` (e.g. 150%) constrains the total cover, and collateral is valued from
   the member's **Assets** tab or the fixed-asset register.
5. The `GuarantorsReport` must reconcile reserved amounts back to savings balances.

---

## 7. Loan repayment and allocation

```mermaid
flowchart TD
    P(["Payment received<br/>teller, online, bulk, transfer"]) --> ID["Identify loan account<br/>and payment method"]
    ID --> DUP{"Idempotency key<br/>already used?"}
    DUP -->|"Yes"| NOP["Return original receipt<br/>no new posting"]
    DUP -->|"No"| ALLOC["Allocate in product order:<br/>penalty → charges → interest → principal"]
    ALLOC --> SPLIT["Compute split from<br/>accrual + schedule state"]
    SPLIT --> POST["Post compound entry"]
    POST --> SCHED["Update schedule lines<br/>mark paid / partial"]
    SCHED --> ARR{"Any overdue<br/>installments?"}
    ARR -->|"Yes"| FLAG["Set Delinquent,<br/>compute days in arrears"]
    ARR -->|"No"| CLEAR["Clear Delinquent if set"]
    FLAG --> CLOSE{"Balance zero?"}
    CLEAR --> CLOSE
    CLOSE -->|"Yes"| SHUT["Close loan,<br/>release guarantors"]
    CLOSE -->|"No"| RECEIPT["Issue receipt + SMS"]
    SHUT --> RECEIPT
    RECEIPT --> NOP
```

**Rules**

1. **Allocation order is product configuration**: `Charges, Interest and Principal` is the
   observed default. Never hardcode.
2. **Interest is accrued separately from billed.** A repayment reverses the accrued interest
   receivable (`1505`) and recognises income (`4001`/`4005`) in the same entry.
3. **Overpayment** is not negative principal — it posts to `2004 Overpayments` and can be
   refunded or offset.
4. **Advance payments** follow `Advance Payments Adjustment` = `Adjust Next Installment`.
5. **Early settlement** uses `Pre-closure Interest Calculation` and must not double-charge.
6. **`Recalculate Interest On Repayment` / `On Accrual`** are product switches — respect them
   or the schedule will drift.
7. The observed entry for a bank repayment: **Dr 1205 Staff Loan + Dr 4005 Interest Income,
   Cr 1005 Bank NMB**. The direction is unusual (income debited) but it is what the ledger
   shows; verify against your own accounting policy before copying.

---

## 8. Teller transaction with asynchronous accounting posting

```mermaid
sequenceDiagram
    autonumber
    actor T as Teller
    participant UI as Teller console
    participant API as Transaction API
    participant DB as Operational DB
    participant OUT as Outbox
    participant W as Posting worker
    participant PE as Posting engine
    participant LED as Ledger
    participant SUP as Supervisor

    T->>UI: open till (denomination count + float)
    UI->>API: request till opening
    API->>SUP: approval request
    SUP-->>API: approve
    API->>DB: till session Open

    T->>UI: savings deposit / repayment / withdrawal
    UI->>API: POST transaction + Idempotency-Key
    API->>DB: insert transaction<br/>status=Submitted, accounting=Pending
    API->>OUT: emit TransactionSubmitted
    API-->>UI: 201 + receipt

    par approval
        SUP->>API: approve (if over threshold)
        API->>DB: status=Approved
    and posting
        OUT->>W: deliver event
        W->>PE: build double entry from template
        PE->>PE: validate balanced + period open
        PE->>LED: post entry (atomic)
        LED-->>W: entry id
        W->>DB: accounting=Posted
    end

    alt posting fails
        W->>DB: accounting=Failed, reason
        UI->>T: banner "N transaction(s) not posted"
        T->>API: Resubmit
        API->>OUT: re-emit (same idempotency key)
    end

    T->>UI: close till
    UI->>API: counted cash + denominations
    API->>API: variance = counted - system
    API->>DB: till Closed, variance recorded
```

**Rules**

1. **Two-phase commit is not available across services; use an outbox.** Operational insert
   and outbox insert happen in one database transaction.
2. **Idempotency key = (transaction number) or client-supplied UUID.** Re-submission must
   produce the same ledger entry, not a second one.
3. **Posting is atomic per entry**: header + lines, balanced, period open, ledger active.
4. **The banner is a first-class UI element.** It names the count and offers `Resubmit`.
5. **Till variance is a real accounting difference.** Route it to a cash-shortage/overage
   ledger; never silently adjust.
6. **Denominations are captured at open and close** so a physical cash count can be audited.

---

## 9. Till session state

```mermaid
stateDiagram-v2
    [*] --> Requested : teller requests opening float
    Requested --> Open : supervisor approves
    Requested --> Rejected : supervisor rejects
    Open --> Open : transactions
    Open --> Counting : teller closes
    Counting --> Balanced : counted = system
    Counting --> Variance : counted != system
    Variance --> Balanced : variance approved + posted
    Balanced --> Closed
    Closed --> [*]
    Rejected --> [*]
```

**Rules.** One open session per teller per branch at a time. A teller cannot transact without
an open session. Till balances map to dedicated GL accounts (`1010 TELLERS`, `1011 Teller 2`,
`1012 Teller 1`), not to the vault.

---

## 10. Online collection and reconciliation

```mermaid
flowchart TD
    PAY(["Member pays via<br/>MNO or bank"]) --> HOOK["Provider callback<br/>or statement file"]
    HOOK --> MATCH{"Reference matches<br/>an account number?"}
    MATCH -->|"Yes"| CRED["Credit that account<br/>post entry"]
    MATCH -->|"No"| NAT{"Reference matches<br/>a National ID?"}
    NAT -->|"Yes"| PREF["Credit member's account<br/>in preferred savings product"]
    NAT -->|"No"| ATT["Route to Need Attention<br/>exception queue"]
    PREF --> CRED
    CRED --> NOTIFY["Notify member<br/>CreditTransactionWithFeeMessage"]
    ATT --> OPS["Operations officer<br/>manually matches"]
    OPS --> CRED
    HOOK --> RECON["Reconciliation workspace<br/>upload statement, match lines"]
    RECON --> DIFF{"System vs provider<br/>difference?"}
    DIFF -->|"No"| DONE(["Reconciled"])
    DIFF -->|"Yes"| CASE["Create reconciliation case<br/>assign owner, deadline"]
    CASE --> OPS
```

**Rules**

1. **Never guess an account from a partial reference.** Unmatched money goes to an explicit
   queue, not to a suspense account that nobody watches.
2. Provider callbacks are **at-least-once**. Deduplicate on provider transaction id.
3. Statement upload (`1792648401240_statement.xlsx` shape) is the fallback path when
   callbacks fail; both paths must converge on the same matcher.
4. Fees on inward payments split between member and SACCO per `Fee Settings`.

---

## 11. Bulk import

```mermaid
flowchart TD
    S(["Import: Member / Account / Transaction"]) --> U["Step 1 · Upload CSV or XLSX<br/>max 10 MB"]
    U --> PARSE["Parse headers,<br/>create batch record"]
    PARSE --> MAP["Step 2 · Field mapping<br/>source column to system field"]
    MAP --> VAL["Step 3 · Validate and preview"]
    VAL --> ERR{"Row errors?"}
    ERR -->|"Yes"| REPORT["Show per-row errors<br/>downloadable error file"]
    REPORT --> FIX["Correct source file"]
    FIX --> U
    ERR -->|"No"| COMMIT["Commit batch<br/>all-or-nothing or chunked"]
    COMMIT --> RES["Result summary<br/>uploaded vs rejected"]
    RES --> POST["Post accounting entries<br/>for financial rows"]
    POST --> AUD["Batch audit trail:<br/>file, user, counts, timestamp"]
```

**Rules**

1. **Validate before committing.** The preview step exists because partial imports corrupt
   balances.
2. **Transaction import must post accounting**, otherwise the tenant's ledger drifts on day one.
3. **Batch is re-runnable**: a failed batch is retried or rolled back as a unit.
4. Templates are part of the product: `Member Template`, `Account_Standard_Template.xlsx`,
   `Transaction_Template.xlsx`.
5. 1 061-member imports are normal; design for 10 000 rows without a browser timeout.

---

## 12. Period close and regulatory return

```mermaid
sequenceDiagram
    autonumber
    actor ACC as Accountant
    participant UI as CAMS Admin
    participant ACCS as Accounting service
    participant RPT as Reporting
    participant REG as Regulator portal
    actor MD as Managing Director

    ACC->>UI: close period (month end)
    UI->>ACCS: request close
    ACCS->>ACCS: verify no unposted transactions
    ACCS->>ACCS: verify trial balance balances
    ACCS->>ACCS: verify tills closed, no open sessions
    ACCS->>ACCS: lock period
    ACCS-->>UI: period closed

    ACC->>UI: open MSP return (e.g. MSP01)
    UI->>RPT: generate from ledger + categories
    RPT->>RPT: map 347 categories to statutory lines
    RPT->>RPT: attach prior-period comparatives
    RPT->>RPT: run validation rules
    RPT-->>UI: return with warnings
    ACC->>UI: review and save draft
    MD->>UI: approve
    UI->>RPT: freeze return version
    ACC->>REG: submit (export or portal)
    ACC->>UI: mark submitted, attach acknowledgement
```

**Rules**

1. **Close is gated on the unposted queue being empty.** That is the whole reason the
   banner exists.
2. **Returns are generated, then frozen.** A submitted return keeps its data snapshot and
   template version; later ledger changes do not mutate it.
3. **Validation is explicit**: totals must tie to the trial balance, prior-period columns
   must be populated, and required schedules must be complete.
4. **`Saved Reports`** on every MSP screen implies drafts are persisted per period, and
   regenerating does not overwrite a submitted version.
5. Regulator differs by `Module Type`: TCDC forms (`TCDC-MSPxx`) for SACCOs, BoT forms
   (`BOT-MSPxx-MFI`) for MFIs.

---

## 13. Flow-to-module traceability

| Flow | Primary modules | Key entities |
|---|---|---|
| Member onboarding | Client, Settings/Policies | Client, MembershipPolicy, NextOfKin, Document |
| Group onboarding | Client | Client (group), GroupMember, ClientUser |
| Loan lifecycle | Accounts/Loans, Requests | LoanApplication, LoanStage, Loan |
| Approval sequence | Requests, Messaging | Approval, Assignment, Notification |
| Guarantor blocking | Accounts/Loans, Accounts/Savings | Guarantor, Reservation, Collateral |
| Repayment allocation | Transactions, Accounting | Transaction, ScheduleLine, LedgerEntry |
| Teller + posting | Transactions/Teller, Accounting | TillSession, Transaction, OutboxEvent, PostingRule |
| Till state | Transactions/Teller | TillSession, Denomination |
| Online reconciliation | Transactions/Online | PaymentIntent, ProviderTxn, ReconCase |
| Bulk import | Import | ImportBatch, ImportRow, FieldMapping |
| Period close / return | Accounting, Reports/MSP | Period, Return, ReturnLine, ValidationRule |
