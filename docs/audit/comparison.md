# Phase 3 — reference vs AIMSCAMS comparison

145 reference screens mapped to 142 live routes.
Shell scale: the reference captures are 1.125× our CSS pixels — 231 px sidebar and
76 px header against our 204 px and 68 px, both within 1 px of 204 × 1.125 = 229.5 and 68 × 1.125 = 76.5.

## Summary

| Measure | Value |
| --- | --- |
| Reference screens compared | 140 |
| Placeholder (`In build`) pages | 68 |
| UI-vocabulary coverage below 60% | 60 |
| Table headers under 50% overlap | 26 |
| Pages with at least one flag | 135 |
| Reference screens with no AIMSCAMS route | 3 |
| Mapped routes not measured | 0 |

Mean UI-vocabulary coverage across all 140 measurable screens: **28%**.
Mean across the 72 implemented screens only: **40%**.

Coverage counts only words that recur on 4 or more reference screens, i.e. labels and
column names. Words unique to one screen are that screen's demo data and are not
comparable with synthetic records.

## Shell, typography and palette

Measured on every captured route (1280 × 800, device scale 1):

- Sidebar: 204 px on 140 of 140 screens — reference 231 px ÷ 1.125 = 205 px.
- Header: 68 px on 140 of 140 screens — reference 76 px ÷ 1.125 = 68 px.
- Reference primary teal quantises to `#067272`, i.e. `#057573` — the same token we use.

Body text, row height, control radius and the teal accent therefore match the reference
design once the capture scale is removed. The one ratio that does not match is the page
title: in the reference the title box is about 1.55× the height of a body-text box, while
our `h1` renders at `--fs` and is 1.0×. `docs/11 §2` currently makes a single text size a
rule, so this is a contract conflict to settle in Phase 4, not a styling bug.

## Reference screens with no AIMSCAMS route

| Reference screen | Reason |
| --- | --- |
| `account-loan-details-118-schedule` | Loan detail has no schedule tab; the schedule is not exposed on its own page. |
| `clients-group-1789` | Client groups exist only as a create form; no group detail screen. |
| `messages-template-list-create-3793` | Templates are seeded, not authored in the UI. |

## Placeholder pages (reference has a working screen)

| Live route | Reference screen | Reference title |
| --- | --- | --- |
| `/accounting-reports-Assets` | `accounting-reports-Assets` | AssetsReport |
| `/accounting-reports-ComprehensiveTrialBalance` | `accounting-reports-ComprehensiveTrialBalance` | Comprehensive Trial Balance |
| `/accounting-reports-CorporateTaxStatement` | `accounting-reports-CorporateTaxStatement` | CorporateTaxStatement |
| `/accounting-reports-LedgerStatementReport` | `accounting-reports-LedgerStatementReport` | LedgerStatement |
| `/accounting-reports-MonthlyTrialBalance` | `accounting-reports-MonthlyTrialBalance` | Monthly Trial Balance |
| `/accounting-reports-OwnersEquity` | `accounting-reports-OwnersEquity` | Owner Equity |
| `/accounting-reports-Reconciliation` | `accounting-reports-Reconciliation` | LedgerReconciliation |
| `/accounting-reports-notes-of-account` | `accounting-reports-notes-of-account` | Notes of Account |
| `/accounting-reports-reconcile-statement` | `accounting-reports-reconcile-statement` | Reconcile Statement |
| `/accounting-reports-reconcile-statement-settings` | `accounting-reports-reconcile-statement-settings` | ReconcileStatementSettings |
| `/business-account` | `core-wba-business-account` | [unreadable] |
| `/messages-recharge-credits` | `messages-recharge-credits` | Recharge Credits |
| `/messages-segment-list` | `messages-segment-list` | MessageService |
| `/messages-segment-list-create` | `messages-segment-list-create` | Create Segment |
| `/messages-users-list` | `messages-users-list` | Message Service |
| `/reports-client-ClientListReport` | `reports-client-ClientListReport` | Client List Report |
| `/reports-client-MemberVerificationReport` | `reports-client-MemberVerificationReport` | Member Verification Report |
| `/reports-loan-AccruedInstallmentsReport` | `reports-loan-AccruedInstallmentsReport` | Accrued Installments Report |
| `/reports-loan-AccruedInterestReport` | `reports-loan-AccruedInterestReport` | Accrued Interest Report |
| `/reports-loan-ActiveLoanReport` | `reports-loan-ActiveLoanReport` | Active Loan Report |
| `/reports-loan-AllLoanReport` | `reports-loan-AllLoanReport` | All Loan Report |
| `/reports-loan-DeferredInterestReport` | `reports-loan-DeferredInterestReport` | Deferred Interest Report |
| `/reports-loan-ExpectedLoanRepaymentsReport` | `reports-loan-ExpectedLoanRepaymentsReport` | Expected Loan Repayments Report |
| `/reports-loan-ExpectedPaymentByDateReport` | `reports-loan-ExpectedPaymentByDateReport` | Expected Payment By Date Report |
| `/reports-loan-ExpectedRepaymentReport` | `reports-loan-ExpectedRepaymentReport` | Expected Repayment Report |
| `/reports-loan-FeeStatusReport` | `reports-loan-FeeStatusReport` | Fee Status Report |
| `/reports-loan-GuarantorsReport` | `reports-loan-GuarantorsReport` | Guarantors Report |
| `/reports-loan-IssuedLoansAndArrearsReport` | `reports-loan-IssuedLoansAndArrearsReport` | Issued Loans And ArrearsReport |
| `/reports-loan-LoanAgingReport` | `reports-loan-LoanAgingReport` | Loan Aging Report |
| `/reports-loan-LoanArrearsReport` | `reports-loan-LoanArrearsReport` | Loan Arrears Report |
| `/reports-loan-LoanDisbursementReport` | `reports-loan-LoanDisbursementReport` | Loan Disbursement Report |
| `/reports-loan-LoanInsuranceReport` | `reports-loan-LoanInsuranceReport` | Loan Insurance Report |
| `/reports-loan-LoanOfficerIncomeReport` | `reports-loan-LoanOfficerIncomeReport` | Loan OfficerIncome Report |
| `/reports-loan-LoanOutstandingReport` | `reports-loan-LoanOutstandingReport` | Loan Outstanding Report |
| `/reports-loan-LoanRepaymentReport` | `reports-loan-LoanRepaymentReport` | Loan Repayment Report |
| `/reports-loan-PaidOffLoansReport` | `reports-loan-PaidOffLoansReport` | Paid Off Loans Report |
| `/reports-loan-PendingLoanApplications` | `reports-loan-PendingLoanApplications` | Pending Loan Applications |
| `/reports-loan-PortfolioRiskReport` | `reports-loan-PortfolioRiskReport` | Portfolio RiskReport |
| `/reports-loan-RiskClassificationOfAssets` | `reports-loan-RiskClassificationOfAssets` | Risk Classification of Assets |
| `/reports-loan-SummarizedPortfolioAtRiskReport` | `reports-loan-SummarizedPortfolioAtRiskReport` | Summarized Portfolio At Risk Report |
| `/reports-loan-TransactionReport` | `reports-loan-TransactionReport` | Transaction Report |
| `/reports-loan-WrittenOffLoanReport` | `reports-loan-WrittenOffLoanReport` | Written Off Loan Report |
| `/reports-msp-MSP01Report` | `reports-msp-MSP01Report` | MSP01 Report |
| `/reports-msp-MSP02Report` | `reports-msp-MSP02Report` | MSP02 Report |
| `/reports-msp-MSP03MFIReport` | `reports-msp-MSP03MFIReport` | MSP03 MFI Report |
| `/reports-msp-MSP03Type1Report` | `reports-msp-MSP03Type1Report` | MSP03 Type1 Report |
| `/reports-msp-MSP03Type2Report` | `reports-msp-MSP03Type2Report` | MSP03 Type2 Report |
| `/reports-msp-MSP04MFIReport` | `reports-msp-MSP04MFIReport` | MSP04 MFI Report |
| `/reports-msp-MSP04Report` | `reports-msp-MSP04Report` | MSP04 Report |
| `/reports-msp-MSP05MFIReport` | `reports-msp-MSP05MFIReport` | MSP05 MFI Report |
| `/reports-msp-MSP05Report` | `reports-msp-MSP05Report` | MSP05 Report |
| `/reports-msp-MSP06Report` | `reports-msp-MSP06Report` | MSP06 Report |
| `/reports-msp-MSP07Report` | `reports-msp-MSP07Report` | MSP07 Report |
| `/reports-msp-MSP08Report` | `reports-msp-MSP08Report` | MSP08 Report |
| `/reports-msp-MSP09MFIReport` | `reports-msp-MSP09MFIReport` | MSP09 MFI Report |
| `/reports-msp-MSP09Report` | `reports-msp-MSP09Report` | MSP09 Report |
| `/reports-msp-MSP10MFIReport` | `reports-msp-MSP10MFIReport` | MSP10 MFI Report |
| `/reports-msp-MSP10Report` | `reports-msp-MSP10Report` | MSP10 Report |
| `/reports-msp-MSP11Report` | `reports-msp-MSP11Report` | MSP11 Report |
| `/reports-saving-SavingBeyondPolicyLimitsReport` | `reports-saving-SavingBeyondPolicyLimitsReport` | Saving Beyond Policy Limits Report |
| `/reports-saving-SavingReport` | `reports-saving-SavingReport` | Saving Report |
| `/reports-saving-SavingSnapshotReport` | `reports-saving-SavingSnapshotReport` | Saving Snapshot Report |
| `/reports-statement-AccountStatementReport` | `reports-statement-AccountStatementReport` | Account Statement Report |
| `/reports-statement-MemberStatementReport` | `reports-statement-MemberStatementReport` | Member Statement Report |
| `/reports-transaction-DailyTransactionReport` | `reports-transaction-DailyTransactionReport` | Daily Transaction Report |
| `/reports-transaction-ExpenseReport` | `reports-transaction-ExpenseReport` | Expense Report |
| `/reports-transaction-FeesIncomeReport` | `reports-transaction-FeesIncomeReport` | Fees Income Report |
| `/reports-transaction-ReversedTransactionReport` | `reports-transaction-ReversedTransactionReport` | Reversed Transaction Report |

## Content coverage below 60% (implemented screens only)

| Route | Coverage | Reference title | Reference column words missing here |
| --- | --- | --- | --- |
| `/settings/policies/holidays` | 0% | Holidays | friday, monday, saturday, thursday, tuesday, wednesday |
| `/account-loan-details/[id]/documents` | 10% | [unreadable] | charges, documents, guarantors, history, repayments, schedule, summary, transactions |
| `/settings/policies/credit-product/[id]` | 10% | Credit Product Pollcy Detalls | action, actions, approval, comment, date, policy, status |
| `/transaction-teller-transaction-request` | 10% | Teller Transaction | teller, transaction |
| `/account-loan-details/[id]/guarantors` | 11% | [unreadable] | charges, documents, guarantors, hstory, rrpuyments, schedule, summary, transactions |
| `/account-loan-details/[id]/repayments` | 11% | [unreadable] | charges, documents, guarantors, hlstory, repayments, schedule, summary, transactions |
| `/import-account` | 13% | Account Import | batch, date, file, records, reference, status, template, total, type, uploaded |
| `/account-loan-details/[id]/transactions` | 14% | [unreadable] | docun, guarantors, history, repayments, schedule, summary, transactions |
| `/import-member` | 14% | Member Import | batch, date, file, records, reference, status, total, uploaded |
| `/import-transaction` | 14% | Transaction Import | import, template, transaction, transeetion, upload |
| `/messages-template-list` | 15% | Message Service | groupfeedepos, groupfeedepositmessage, number, ositmessage, pald, transaction |
| `/settings/users` | 17% | NewUser | — |
| `/accounting-reports-JournalBook` | 19% | Journal Book Report | assets, interest, number, receivable |
| `/settings/products/interest-rates` | 20% | Product Setup | interest, loan, penalties, product, savings |
| `/settings/policies/credit-product` | 22% | Credit Product Polley | approved, business, individual, loans, month, months |
| `/settings/products/fee-penalties` | 24% | Product Setup | charge, fiters, number, qsearch, type |
| `/messages-message-logs` | 25% | Message Service | failed, loandisbursedmessage, number, transactional |
| `/transaction-online-payment-reconciliation` | 25% | Online Transactions Reconcillation | date, name, provider, status, uploaded |
| `/accounting-reports-CashFlowStatement` | 26% | Cash Flow Statement | notes, previous, year |
| `/import-member-new` | 27% | Members | file, fleld, mapping, preview, result, upload, validation |
| `/import-account-new` | 29% | Import member savings, shares, and loans (account import) | file, fleld, mapping, preview, result, upload, validation |
| `/accounting-reports-CashBook` | 30% | Cash Book Report | assets, number |
| `/accounting-chart-of-accounts` | 31% | Chart of Accounts | actlons, balance, name |
| `/accounting-ledger-entries` | 31% | LedgerEntries | account, dute, ledgor, range, type |
| `/settings/products/loan/[id]` | 32% | Loan Product Details | — |
| `/transaction-teller-transaction-history` | 32% | Teller Transaction | account, cllent, credit, debit, ledger, name, number, product, transaction, type |
| `/accounting-reports-IncomeStatementReport` | 33% | Income Statement | notes, number |
| `/import-transaction-new` | 33% | Transactions | file, fleld, mapping, preview, result, upload, validation |
| `/messages-send-message` | 33% | Send Message | cancel, message, send, test |
| `/settings/products/provisioning-rules` | 33% | Product Setup | interest, loan, product, savings |

## Highest-coverage screens

| Route | Coverage | Reference title | Our title |
| --- | --- | --- | --- |
| `/accounting-reports` | 94% | Accounting Reports | Financial reports |
| `/reports-statement` | 80% | Statement Reports | Statement hub |
| `/account-loan-application-create` | 78% | Create Loan Application | New loan application |
| `/accounting-entries` | 72% | Entries | Journal entries |
| `/account-loan-application-edit/[id]` | 71% | Update Loan Application | Edit loan application |
| `/clients` | 71% | Clients | Clients |
| `/settings/branches/new` | 70% | Add Branch | Add branch |
| `/settings/roles` | 70% | Role Management | Roles |
| `/clients/create` | 67% | Create New Client | Add client |
| `/reports-loan` | 67% | Loan Reports | Loan reports |
| `/settings/accounting` | 62% | Accounting | Accounting settings |
| `/clients/create-group` | 60% | Create New Group | Add group |

## By module

| Module | Screens | Placeholders | Mean coverage (implemented) |
| --- | --- | --- | --- |
| reports | 55 | 53 | 74% |
| settings | 27 | 0 | 40% |
| accounting | 22 | 10 | 43% |
| account | 12 | 0 | 38% |
| messages | 7 | 4 | 24% |
| import | 6 | 0 | 22% |
| transaction | 6 | 0 | 33% |
| clients | 3 | 0 | 66% |
| business | 1 | 1 | — |
| requests | 1 | 0 | 47% |

## Table headers

26 screens have less than half of their reference header words in our table header.

| Route | Overlap | Reference headers | Our headers |
| --- | --- | --- | --- |
| `/account-loan-details/[id]` | 0% | Online rel / Reschedule Loen / Write off / Close lk | # / Due date / Opening / Principal / Interest / Total / Closing / Status |
| `/accounting-reports-CashBook` | 0% | 09-Jan-[number] / BANK CRDB / Assets | Date / Entry / Description / Debit / Credit / Running |
| `/accounting-reports-JournalBook` | 0% | 01-Jan-[number] / Interest Receivable / Assets | Entry no. / Date / Event / Status / Debit / Credit / Description |
| `/messages-message-logs` | 0% | Oct 12, [number], 2:43:50 PM / SMS / Failed / Transactional / LoanDisbursedMessage / MFSL  | Channel / Recipient / Status / Provider / Credits / Sent at / Created |
| `/settings/accounting` | 0% | Financial Year / Manage categories / Cash/Bank Accounts | Period / Starts / Ends / Status / Actions |
| `/settings/policies/credit-product` | 0% | ASSET FINANCING / Business Individual Loans / 3.5% per Month / 100,000.00 to 20,000,000.00 | Code / Name / Status / Created / Actions |
| `/settings/policies/holidays` | 0% | Monday / Tuesday / Wednesday / Thursday / Friday / Saturday | Name / Date |
| `/transaction-online-payment-reconciliation` | 0% | Provider Name / Status / Uploaded Date / Uploaded By | Reference / Type / Amount / Accounting / Client |
| `/transaction-teller-transaction` | 0% | Teller Transaction / DRANCH STATUS / BALANCE | Reference / Type / Amount / Status / Accounting / Client |
| `/accounting-ledger-entries` | 17% | Dute Range / Ledgor Account / Entry Type | Date / Entry / Narration / Memo / Debit / Credit / Balance |
| `/settings/products/interest-rates` | 17% | Loan Product / Savings Product / Interest Rate / Fee & Penalties | Code / Name / Status / Rate / Period / Effective from / Actions |
| `/settings/products/provisioning-rules` | 20% | Loan Product / Savings Product / Interest Rate | Code / Name / Status / Days from / Days to / Rate / GL account / Actions |
| `/transaction-teller-transaction-history` | 23% | Transaction Id / Transaction Date / Transaction Type / Product Name / Cllent Name / Accoun | Business date / Teller / Branch / Opening float / System balance / Variance / Status / Tra |
| `/accounting-reports-CashFlowStatement` | 25% | Notes / Amount (TSh) / Previous Year Amount (TSh) | Summary / Amount |
| `/settings/products/fee-penalties` | 29% | QSearch / Account Number V / Charge Name / Charge Type / 十 Add Fiters | Code / Name / Kind / Amount / GL account / Status / Actions |
| `/account-loan-application` | 33% | Member Name / Product / Loan Officer / stape / Status / Tenure / Tenure Period / Created D | Application number / Client / Product / Principal / Tenure / Interest rate / Status / Crea |
| `/accounting-reports-FinancialPositionReport` | 33% | ASSETS / Notes No. / Amount (TSh) 21 Oct [number] | Code / Account / Amount |
| `/accounting-reports-IncomeStatementReport` | 33% | INCOME / Notes No. / Amount (TSh) 21 0ct [number] / Amount (TSh) 31-Dec-[number] | Code / Account / Amount |
| `/settings/branches` | 33% | Branch Name / Branch Code / Address / Region / Distriet / Ward | Branch / Code / Region / Council / Staff / Status / Default / Actions |
| `/settings/products/loan` | 33% | ASSET FINANCING / 3.5% per Month / 100,000.00 to 20,000,000.00 / Months 4 to 96 / Aetive | Code / Name / Status / Interest rate / Tenure (months) / Actions |
| `/transaction-all-transaction` | 33% | Date / Session Date / Member Name / Transaction Number / Account Number / Type / Amount (T | Reference / Client / Transaction type / Amount / Payment method / Transaction status / Acc |
| `/settings/users` | 38% | Emall Address / Full Name / Phone Number / Status / Role Name | Full name / Email / Branch / Roles / Status / Actions |
| `/account-loan` | 40% | Account Number / Member Name / Product / Loan Officer / Status / Tenure / Loan Amount ( | Loan number / Client / Product / Principal / Outstanding / Status / Created / Actions |
| `/accounting-chart-of-accounts` | 40% | Account Name / Type / O/P Balance (TSh) / C/L Balance (TSh) / Actlons | Code / Account / Type / Normal side / Postable |
| `/settings/products/savings` | 40% | Loan Product / Interest Rate / Fee & Penalties | Code / Name / Status / Interest rate / Min. balance / Flags / Actions |
| `/settings/products/provisioning-rules` | 43% | Category' / Min Days * / Max Days * / Percentage * / Liabllity Account * / Expenses Accoun | Code / Name / Status / Days from / Days to / Rate / GL account / Actions |

## Structural flags by route

| Route | Flags |
| --- | --- |
| `/account-loan` | low coverage, header differs, no search, no add action |
| `/account-loan-application` | low coverage, header differs, no search |
| `/account-loan-application-details/[id]` | low coverage, no actions column, no add action |
| `/account-loan-application-details/[id]` | low coverage, no actions column |
| `/account-loan-details/[id]` | low coverage, header differs |
| `/account-loan-details/[id]/documents` | low coverage, no actions column |
| `/account-loan-details/[id]/guarantors` | low coverage, no actions column |
| `/account-loan-details/[id]/repayments` | low coverage |
| `/account-loan-details/[id]/transactions` | low coverage |
| `/account-saving` | low coverage, no search |
| `/accounting-assets` | low coverage, title differs, no add action |
| `/accounting-chart-of-accounts` | low coverage, header differs, no add action, unpaged >10 rows |
| `/accounting-entries` | no search |
| `/accounting-fixed-asset` | low coverage, no add action |
| `/accounting-ledger-entries` | low coverage, header differs, title differs |
| `/accounting-reports-Assets` | placeholder, low coverage, title differs |
| `/accounting-reports-CashBook` | low coverage, header differs |
| `/accounting-reports-CashFlowStatement` | low coverage, header differs |
| `/accounting-reports-ComprehensiveTrialBalance` | placeholder, low coverage, title differs |
| `/accounting-reports-CorporateTaxStatement` | placeholder, low coverage |
| `/accounting-reports-FinancialPositionReport` | low coverage, header differs, unpaged >10 rows |
| `/accounting-reports-IncomeStatementReport` | low coverage, header differs, unpaged >10 rows |
| `/accounting-reports-JournalBook` | low coverage, header differs |
| `/accounting-reports-LedgerStatementReport` | placeholder, low coverage, title differs |
| `/accounting-reports-MonthlyTrialBalance` | placeholder, low coverage, title differs |
| `/accounting-reports-OwnersEquity` | placeholder, low coverage, title differs |
| `/accounting-reports-Reconciliation` | placeholder, low coverage, title differs |
| `/accounting-reports-TrialBalanceReport` | low coverage, unpaged >10 rows |
| `/accounting-reports-notes-of-account` | placeholder, low coverage |
| `/accounting-reports-reconcile-statement` | placeholder, low coverage |
| `/accounting-reports-reconcile-statement-settings` | placeholder, low coverage, title differs, no add action |
| `/business-account` | placeholder, low coverage, no search, no add action |
| `/clients` | no search |
| `/clients/create` | no search |
| `/clients/create-group` | no search |
| `/import-account` | low coverage, no search, no add action |
| `/import-account-new` | low coverage |
| `/import-member` | low coverage, no search, no add action |
| `/import-member-new` | low coverage, title differs |
| `/import-transaction` | low coverage, no search, no add action |
| `/import-transaction-new` | low coverage, title differs |
| `/messages-message-logs` | low coverage, header differs, title differs |
| `/messages-recharge-credits` | placeholder, low coverage |
| `/messages-segment-list` | placeholder, low coverage, title differs |
| `/messages-segment-list-create` | placeholder, low coverage |
| `/messages-send-message` | low coverage |
| `/messages-template-list` | low coverage, title differs, no add action |
| `/messages-users-list` | placeholder, low coverage, no add action |
| `/reports-client-ClientListReport` | placeholder, low coverage |
| `/reports-client-MemberVerificationReport` | placeholder, low coverage, title differs |
| `/reports-loan-AccruedInstallmentsReport` | placeholder, low coverage, title differs |
| `/reports-loan-AccruedInterestReport` | placeholder, low coverage, title differs |
| `/reports-loan-ActiveLoanReport` | placeholder, low coverage |
| `/reports-loan-AllLoanReport` | placeholder, low coverage |
| `/reports-loan-DeferredInterestReport` | placeholder, low coverage, title differs |
| `/reports-loan-ExpectedLoanRepaymentsReport` | placeholder, low coverage |
| `/reports-loan-ExpectedPaymentByDateReport` | placeholder, low coverage, title differs |
| `/reports-loan-ExpectedRepaymentReport` | placeholder, low coverage, title differs |
| `/reports-loan-FeeStatusReport` | placeholder, low coverage, title differs |
| `/reports-loan-GuarantorsReport` | placeholder, low coverage, title differs |
| `/reports-loan-IssuedLoansAndArrearsReport` | placeholder, low coverage, title differs |
| `/reports-loan-LoanAgingReport` | placeholder, low coverage |
| `/reports-loan-LoanArrearsReport` | placeholder, low coverage |
| `/reports-loan-LoanDisbursementReport` | placeholder, low coverage |
| `/reports-loan-LoanInsuranceReport` | placeholder, low coverage |
| `/reports-loan-LoanOfficerIncomeReport` | placeholder, low coverage |
| `/reports-loan-LoanOutstandingReport` | placeholder, low coverage |
| `/reports-loan-LoanRepaymentReport` | placeholder, low coverage |
| `/reports-loan-PaidOffLoansReport` | placeholder, low coverage, title differs |
| `/reports-loan-PendingLoanApplications` | placeholder, low coverage |
| `/reports-loan-PortfolioRiskReport` | placeholder, low coverage, title differs |
| `/reports-loan-RiskClassificationOfAssets` | placeholder, low coverage, title differs |
| `/reports-loan-SummarizedPortfolioAtRiskReport` | placeholder, low coverage, title differs |
| `/reports-loan-TransactionReport` | placeholder, low coverage, title differs |
| `/reports-loan-WrittenOffLoanReport` | placeholder, low coverage |
| `/reports-msp-MSP01Report` | placeholder, low coverage, title differs |
| `/reports-msp-MSP02Report` | placeholder, low coverage, title differs |
| `/reports-msp-MSP03MFIReport` | placeholder, low coverage, title differs |
| `/reports-msp-MSP03Type1Report` | placeholder, low coverage, title differs |
| `/reports-msp-MSP03Type2Report` | placeholder, low coverage, title differs |
| `/reports-msp-MSP04MFIReport` | placeholder, low coverage, title differs |
| `/reports-msp-MSP04Report` | placeholder, low coverage, title differs |
| `/reports-msp-MSP05MFIReport` | placeholder, low coverage, title differs |
| `/reports-msp-MSP05Report` | placeholder, low coverage, title differs |
| `/reports-msp-MSP06Report` | placeholder, low coverage, title differs |
| `/reports-msp-MSP07Report` | placeholder, low coverage, title differs |
| `/reports-msp-MSP08Report` | placeholder, low coverage, title differs |
| `/reports-msp-MSP09MFIReport` | placeholder, low coverage, title differs |
| `/reports-msp-MSP09Report` | placeholder, low coverage, title differs |
| `/reports-msp-MSP10MFIReport` | placeholder, low coverage, title differs |
| `/reports-msp-MSP10Report` | placeholder, low coverage, title differs |
| `/reports-msp-MSP11Report` | placeholder, low coverage, title differs |
| `/reports-saving-SavingBeyondPolicyLimitsReport` | placeholder, low coverage |
| `/reports-saving-SavingReport` | placeholder, low coverage |
| `/reports-saving-SavingSnapshotReport` | placeholder, low coverage |
| `/reports-statement-AccountStatementReport` | placeholder, low coverage |
| `/reports-statement-MemberStatementReport` | placeholder, low coverage |
| `/reports-transaction-DailyTransactionReport` | placeholder, low coverage |
| `/reports-transaction-ExpenseReport` | placeholder, low coverage, title differs |
| `/reports-transaction-FeesIncomeReport` | placeholder, low coverage, title differs |
| `/reports-transaction-ReversedTransactionReport` | placeholder, low coverage |
| `/requests` | low coverage, title differs, no search |
| `/settings/accounting` | header differs |
| `/settings/branches` | low coverage, header differs |
| `/settings/branches/new` | title differs |
| `/settings/general` | low coverage |
| `/settings/policies/credit-product` | low coverage, header differs, no search |
| `/settings/policies/credit-product/[id]` | low coverage, no actions column |
| `/settings/policies/credit-product/[id]/edit` | low coverage |
| `/settings/policies/holidays` | low coverage, header differs, title differs |
| `/settings/policies/membership` | low coverage, title differs, no search |
| `/settings/policies/membership/[id]` | low coverage, title differs, no actions column |
| `/settings/policies/membership/[id]` | low coverage, no actions column |
| `/settings/policies/membership/[id]/edit` | low coverage, no add action |
| `/settings/policies/membership/[id]/edit` | low coverage |
| `/settings/policies/membership/new` | low coverage, no add action |
| `/settings/products/fee-penalties` | low coverage, header differs, title differs, no search |
| `/settings/products/interest-rates` | low coverage, header differs, title differs, no search |
| `/settings/products/interest-rates/new` | low coverage |
| `/settings/products/loan` | low coverage, header differs, title differs, no search |
| `/settings/products/loan/[id]` | low coverage |
| `/settings/products/provisioning-rules` | low coverage, header differs, title differs, no search |
| `/settings/products/provisioning-rules` | low coverage, header differs |
| `/settings/products/savings` | low coverage, header differs, title differs, no search |
| `/settings/products/savings` | low coverage |
| `/settings/products/savings/new` | low coverage, no add action |
| `/settings/roles` | title differs, no search |
| `/settings/users` | low coverage, header differs, title differs |
| `/settings/users` | low coverage, title differs |
| `/transaction-all-transaction` | low coverage, header differs, no search, no add action |
| `/transaction-online-payment-reconciliation` | low coverage, header differs, title differs |
| `/transaction-online-transaction` | low coverage, title differs, no search |
| `/transaction-teller-transaction` | low coverage, header differs |
| `/transaction-teller-transaction-history` | low coverage, header differs, no search |
| `/transaction-teller-transaction-request` | low coverage |

## Per-screen detail

| Reference screen | Live route | Our title | Coverage | Flags |
| --- | --- | --- | --- | --- |
| `account-loan` | `/account-loan` | Loans | 47% | low coverage, header differs, no search, no add action |
| `account-loan-application` | `/account-loan-application` | Loan applications | 41% | low coverage, header differs, no search |
| `account-loan-application-create` | `/account-loan-application-create` | New loan application | 78% | — |
| `account-loan-application-details-124` | `/account-loan-application-details/[id]` | Loan application 000007 | 43% | low coverage, no actions column |
| `account-loan-application-details-39` | `/account-loan-application-details/[id]` | Loan application 000007 | 45% | low coverage, no actions column, no add action |
| `account-loan-application-edit-39` | `/account-loan-application-edit/[id]` | Edit loan application | 71% | — |
| `account-loan-details-118-documents` | `/account-loan-details/[id]/documents` | Documents · 000001 | 10% | low coverage, no actions column |
| `account-loan-details-118-guarantors` | `/account-loan-details/[id]/guarantors` | Guarantors · 000001 | 11% | low coverage, no actions column |
| `account-loan-details-118-repayments` | `/account-loan-details/[id]/repayments` | Repayment history · 000001 | 11% | low coverage |
| `account-loan-details-118-summary` | `/account-loan-details/[id]` | Loan 000001 | 37% | low coverage, header differs |
| `account-loan-details-118-transactions` | `/account-loan-details/[id]/transactions` | Transactions · 000001 | 14% | low coverage |
| `account-saving` | `/account-saving` | Savings accounts | 50% | low coverage, no search |
| `accounting-assets` | `/accounting-assets` | Asset types | 43% | low coverage, title differs, no add action |
| `accounting-chart-of-accounts` | `/accounting-chart-of-accounts` | Chart of accounts | 31% | low coverage, header differs, no add action, unpaged >10 rows |
| `accounting-entries` | `/accounting-entries` | Journal entries | 72% | no search |
| `accounting-fixed-asset` | `/accounting-fixed-asset` | Fixed asset register | 56% | low coverage, no add action |
| `accounting-ledger-entries` | `/accounting-ledger-entries` | Ledger entries | 31% | low coverage, header differs, title differs |
| `accounting-reports` | `/accounting-reports` | Financial reports | 94% | — |
| `accounting-reports-Assets` | `/accounting-reports-Assets` | Assets | 27% | placeholder, low coverage, title differs |
| `accounting-reports-CashBook` | `/accounting-reports-CashBook` | Cash book | 30% | low coverage, header differs |
| `accounting-reports-CashFlowStatement` | `/accounting-reports-CashFlowStatement` | Cash flow statement | 26% | low coverage, header differs |
| `accounting-reports-ComprehensiveTrialBalance` | `/accounting-reports-ComprehensiveTrialBalance` | ComprehensiveTrialBalance | 4% | placeholder, low coverage, title differs |
| `accounting-reports-CorporateTaxStatement` | `/accounting-reports-CorporateTaxStatement` | CorporateTaxStatement | 0% | placeholder, low coverage |
| `accounting-reports-FinancialPositionReport` | `/accounting-reports-FinancialPositionReport` | Financial position | 37% | low coverage, header differs, unpaged >10 rows |
| `accounting-reports-GeneralLedgerBook` | `/accounting-reports-GeneralLedgerBook` | General ledger book | — | — |
| `accounting-reports-IncomeStatementReport` | `/accounting-reports-IncomeStatementReport` | Income statement | 33% | low coverage, header differs, unpaged >10 rows |
| `accounting-reports-JournalBook` | `/accounting-reports-JournalBook` | Journal book | 19% | low coverage, header differs |
| `accounting-reports-LedgerStatementReport` | `/accounting-reports-LedgerStatementReport` | LedgerStatementReport | 7% | placeholder, low coverage, title differs |
| `accounting-reports-MonthlyTrialBalance` | `/accounting-reports-MonthlyTrialBalance` | MonthlyTrialBalance | 0% | placeholder, low coverage, title differs |
| `accounting-reports-OwnersEquity` | `/accounting-reports-OwnersEquity` | OwnersEquity | 0% | placeholder, low coverage, title differs |
| `accounting-reports-Reconciliation` | `/accounting-reports-Reconciliation` | Reconciliation | 11% | placeholder, low coverage, title differs |
| `accounting-reports-TrialBalanceReport` | `/accounting-reports-TrialBalanceReport` | Trial balance | 42% | low coverage, unpaged >10 rows |
| `accounting-reports-notes-of-account` | `/accounting-reports-notes-of-account` | notes of account | 29% | placeholder, low coverage |
| `accounting-reports-reconcile-statement` | `/accounting-reports-reconcile-statement` | reconcile statement | 29% | placeholder, low coverage |
| `accounting-reports-reconcile-statement-settings` | `/accounting-reports-reconcile-statement-settings` | reconcile statement settings | 38% | placeholder, low coverage, title differs, no add action |
| `clients` | `/clients` | Clients | 71% | no search |
| `clients-create` | `/clients/create` | Add client | 67% | no search |
| `clients-create-group` | `/clients/create-group` | Add group | 60% | no search |
| `core-wba-business-account` | `/business-account` | Business account | 11% | placeholder, low coverage, no search, no add action |
| `import-account` | `/import-account` | Account import batches | 13% | low coverage, no search, no add action |
| `import-account-new` | `/import-account-new` | Account import wizard | 29% | low coverage |
| `import-member` | `/import-member` | Member import batches | 14% | low coverage, no search, no add action |
| `import-member-new` | `/import-member-new` | Member import wizard | 27% | low coverage, title differs |
| `import-transaction` | `/import-transaction` | Transaction import batches | 14% | low coverage, no search, no add action |
| `import-transaction-new` | `/import-transaction-new` | Transaction import wizard | 33% | low coverage, title differs |
| `messages-message-logs` | `/messages-message-logs` | Delivery logs | 25% | low coverage, header differs, title differs |
| `messages-recharge-credits` | `/messages-recharge-credits` | Recharge credits | 25% | placeholder, low coverage |
| `messages-segment-list` | `/messages-segment-list` | Segments | 12% | placeholder, low coverage, title differs |
| `messages-segment-list-create` | `/messages-segment-list-create` | Create segment | 14% | placeholder, low coverage |
| `messages-send-message` | `/messages-send-message` | Send message | 33% | low coverage |
| `messages-template-list` | `/messages-template-list` | Templates | 15% | low coverage, title differs, no add action |
| `messages-users-list` | `/messages-users-list` | Message users | 14% | placeholder, low coverage, no add action |
| `reports-client-ClientListReport` | `/reports-client-ClientListReport` | client ClientListReport | 14% | placeholder, low coverage |
| `reports-client-MemberVerificationReport` | `/reports-client-MemberVerificationReport` | client MemberVerificationReport | 9% | placeholder, low coverage, title differs |
| `reports-loan` | `/reports-loan` | Loan reports | 67% | — |
| `reports-loan-AccruedInstallmentsReport` | `/reports-loan-AccruedInstallmentsReport` | loan AccruedInstallmentsReport | 11% | placeholder, low coverage, title differs |
| `reports-loan-AccruedInterestReport` | `/reports-loan-AccruedInterestReport` | loan AccruedInterestReport | 14% | placeholder, low coverage, title differs |
| `reports-loan-ActiveLoanReport` | `/reports-loan-ActiveLoanReport` | loan ActiveLoanReport | 5% | placeholder, low coverage |
| `reports-loan-AllLoanReport` | `/reports-loan-AllLoanReport` | loan AllLoanReport | 11% | placeholder, low coverage |
| `reports-loan-DeferredInterestReport` | `/reports-loan-DeferredInterestReport` | loan DeferredInterestReport | 11% | placeholder, low coverage, title differs |
| `reports-loan-ExpectedLoanRepaymentsReport` | `/reports-loan-ExpectedLoanRepaymentsReport` | loan ExpectedLoanRepaymentsReport | 5% | placeholder, low coverage |
| `reports-loan-ExpectedPaymentByDateReport` | `/reports-loan-ExpectedPaymentByDateReport` | loan ExpectedPaymentByDateReport | 13% | placeholder, low coverage, title differs |
| `reports-loan-ExpectedRepaymentReport` | `/reports-loan-ExpectedRepaymentReport` | loan ExpectedRepaymentReport | 10% | placeholder, low coverage, title differs |
| `reports-loan-FeeStatusReport` | `/reports-loan-FeeStatusReport` | loan FeeStatusReport | 13% | placeholder, low coverage, title differs |
| `reports-loan-GuarantorsReport` | `/reports-loan-GuarantorsReport` | loan GuarantorsReport | 15% | placeholder, low coverage, title differs |
| `reports-loan-IssuedLoansAndArrearsReport` | `/reports-loan-IssuedLoansAndArrearsReport` | loan IssuedLoansAndArrearsReport | 14% | placeholder, low coverage, title differs |
| `reports-loan-LoanAgingReport` | `/reports-loan-LoanAgingReport` | loan LoanAgingReport | 11% | placeholder, low coverage |
| `reports-loan-LoanArrearsReport` | `/reports-loan-LoanArrearsReport` | loan LoanArrearsReport | 11% | placeholder, low coverage |
| `reports-loan-LoanDisbursementReport` | `/reports-loan-LoanDisbursementReport` | loan LoanDisbursementReport | 14% | placeholder, low coverage |
| `reports-loan-LoanInsuranceReport` | `/reports-loan-LoanInsuranceReport` | loan LoanInsuranceReport | 15% | placeholder, low coverage |
| `reports-loan-LoanOfficerIncomeReport` | `/reports-loan-LoanOfficerIncomeReport` | loan LoanOfficerIncomeReport | 13% | placeholder, low coverage |
| `reports-loan-LoanOutstandingReport` | `/reports-loan-LoanOutstandingReport` | loan LoanOutstandingReport | 12% | placeholder, low coverage |
| `reports-loan-LoanRepaymentReport` | `/reports-loan-LoanRepaymentReport` | loan LoanRepaymentReport | 15% | placeholder, low coverage |
| `reports-loan-PaidOffLoansReport` | `/reports-loan-PaidOffLoansReport` | loan PaidOffLoansReport | 15% | placeholder, low coverage, title differs |
| `reports-loan-PendingLoanApplications` | `/reports-loan-PendingLoanApplications` | loan PendingLoanApplications | 11% | placeholder, low coverage |
| `reports-loan-PortfolioRiskReport` | `/reports-loan-PortfolioRiskReport` | loan PortfolioRiskReport | 6% | placeholder, low coverage, title differs |
| `reports-loan-RiskClassificationOfAssets` | `/reports-loan-RiskClassificationOfAssets` | loan RiskClassificationOfAssets | 0% | placeholder, low coverage, title differs |
| `reports-loan-SummarizedPortfolioAtRiskReport` | `/reports-loan-SummarizedPortfolioAtRiskReport` | loan SummarizedPortfolioAtRiskReport | 11% | placeholder, low coverage, title differs |
| `reports-loan-TransactionReport` | `/reports-loan-TransactionReport` | loan TransactionReport | 18% | placeholder, low coverage, title differs |
| `reports-loan-WrittenOffLoanReport` | `/reports-loan-WrittenOffLoanReport` | loan WrittenOffLoanReport | 18% | placeholder, low coverage |
| `reports-msp-MSP01Report` | `/reports-msp-MSP01Report` | msp MSP01Report | 33% | placeholder, low coverage, title differs |
| `reports-msp-MSP02Report` | `/reports-msp-MSP02Report` | msp MSP02Report | 33% | placeholder, low coverage, title differs |
| `reports-msp-MSP03MFIReport` | `/reports-msp-MSP03MFIReport` | msp MSP03MFIReport | 33% | placeholder, low coverage, title differs |
| `reports-msp-MSP03Type1Report` | `/reports-msp-MSP03Type1Report` | msp MSP03Type1Report | 33% | placeholder, low coverage, title differs |
| `reports-msp-MSP03Type2Report` | `/reports-msp-MSP03Type2Report` | msp MSP03Type2Report | 14% | placeholder, low coverage, title differs |
| `reports-msp-MSP04MFIReport` | `/reports-msp-MSP04MFIReport` | msp MSP04MFIReport | 17% | placeholder, low coverage, title differs |
| `reports-msp-MSP04Report` | `/reports-msp-MSP04Report` | msp MSP04Report | 11% | placeholder, low coverage, title differs |
| `reports-msp-MSP05MFIReport` | `/reports-msp-MSP05MFIReport` | msp MSP05MFIReport | 15% | placeholder, low coverage, title differs |
| `reports-msp-MSP05Report` | `/reports-msp-MSP05Report` | msp MSP05Report | 13% | placeholder, low coverage, title differs |
| `reports-msp-MSP06Report` | `/reports-msp-MSP06Report` | msp MSP06Report | 13% | placeholder, low coverage, title differs |
| `reports-msp-MSP07Report` | `/reports-msp-MSP07Report` | msp MSP07Report | 15% | placeholder, low coverage, title differs |
| `reports-msp-MSP08Report` | `/reports-msp-MSP08Report` | msp MSP08Report | 15% | placeholder, low coverage, title differs |
| `reports-msp-MSP09MFIReport` | `/reports-msp-MSP09MFIReport` | msp MSP09MFIReport | 15% | placeholder, low coverage, title differs |
| `reports-msp-MSP09Report` | `/reports-msp-MSP09Report` | msp MSP09Report | 15% | placeholder, low coverage, title differs |
| `reports-msp-MSP10MFIReport` | `/reports-msp-MSP10MFIReport` | msp MSP10MFIReport | 12% | placeholder, low coverage, title differs |
| `reports-msp-MSP10Report` | `/reports-msp-MSP10Report` | msp MSP10Report | 18% | placeholder, low coverage, title differs |
| `reports-msp-MSP11Report` | `/reports-msp-MSP11Report` | msp MSP11Report | 13% | placeholder, low coverage, title differs |
| `reports-saving-SavingBeyondPolicyLimitsReport` | `/reports-saving-SavingBeyondPolicyLimitsReport` | saving SavingBeyondPolicyLimitsReport | 17% | placeholder, low coverage |
| `reports-saving-SavingReport` | `/reports-saving-SavingReport` | saving SavingReport | 19% | placeholder, low coverage |
| `reports-saving-SavingSnapshotReport` | `/reports-saving-SavingSnapshotReport` | saving SavingSnapshotReport | 23% | placeholder, low coverage |
| `reports-statement` | `/reports-statement` | Statement hub | 80% | — |
| `reports-statement-AccountStatementReport` | `/reports-statement-AccountStatementReport` | statement AccountStatementReport | 30% | placeholder, low coverage |
| `reports-statement-MemberStatementReport` | `/reports-statement-MemberStatementReport` | statement MemberStatementReport | 30% | placeholder, low coverage |
| `reports-transaction-DailyTransactionReport` | `/reports-transaction-DailyTransactionReport` | transaction DailyTransactionReport | 20% | placeholder, low coverage |
| `reports-transaction-ExpenseReport` | `/reports-transaction-ExpenseReport` | transaction ExpenseReport | 14% | placeholder, low coverage, title differs |
| `reports-transaction-FeesIncomeReport` | `/reports-transaction-FeesIncomeReport` | transaction FeesIncomeReport | 11% | placeholder, low coverage, title differs |
| `reports-transaction-ReversedTransactionReport` | `/reports-transaction-ReversedTransactionReport` | transaction ReversedTransactionReport | 20% | placeholder, low coverage |
| `requests` | `/requests` | Request centre | 47% | low coverage, title differs, no search |
| `settings-account` | `/settings/general` | General | 36% | low coverage |
| `settings-accounting-settings` | `/settings/accounting` | Accounting settings | 62% | header differs |
| `settings-administrator` | `/settings/users` | Users | 50% | low coverage, header differs, title differs |
| `settings-administrator-add` | `/settings/users` | Users | 17% | low coverage, title differs |
| `settings-branch` | `/settings/branches` | Branches | 50% | low coverage, header differs |
| `settings-branch-add` | `/settings/branches/new` | Add branch | 70% | title differs |
| `settings-policies-credit-product-policy` | `/settings/policies/credit-product` | Credit product policies | 22% | low coverage, header differs, no search |
| `settings-policies-credit-product-policy-5` | `/settings/policies/credit-product/[id]` | CPP-STD — Standard credit policy | 10% | low coverage, no actions column |
| `settings-policies-credit-product-policy-5-edit` | `/settings/policies/credit-product/[id]/edit` | Edit credit product policy | 43% | low coverage |
| `settings-policies-holidays` | `/settings/policies/holidays` | Holiday calendar | 0% | low coverage, header differs, title differs |
| `settings-policies-membership-policy` | `/settings/policies/membership` | Membership policies | 44% | low coverage, title differs, no search |
| `settings-policies-membership-policy-1` | `/settings/policies/membership/[id]` | MP-STD — Standard membership | 46% | low coverage, title differs, no actions column |
| `settings-policies-membership-policy-1-edit` | `/settings/policies/membership/[id]/edit` | Edit membership policy | 50% | low coverage, no add action |
| `settings-policies-membership-policy-2` | `/settings/policies/membership/[id]` | MP-STD — Standard membership | 40% | low coverage, no actions column |
| `settings-policies-membership-policy-2-edit` | `/settings/policies/membership/[id]/edit` | Edit membership policy | 45% | low coverage |
| `settings-policies-membership-policy-create` | `/settings/policies/membership/new` | Create membership policy | 50% | low coverage, no add action |
| `settings-products-fee-penalties` | `/settings/products/fee-penalties` | Fees and penalties | 24% | low coverage, header differs, title differs, no search |
| `settings-products-interest-rate` | `/settings/products/interest-rates` | Interest rates | 20% | low coverage, header differs, title differs, no search |
| `settings-products-interest-rate-create` | `/settings/products/interest-rates/new` | Create interest rate | 50% | low coverage |
| `settings-products-loan` | `/settings/products/loan` | Loan products | 59% | low coverage, header differs, title differs, no search |
| `settings-products-loan-5` | `/settings/products/loan/[id]` | LP-STAFF — Staff Loan | 32% | low coverage |
| `settings-products-loan-provisioning` | `/settings/products/provisioning-rules` | Loan provisioning rules | 33% | low coverage, header differs, title differs, no search |
| `settings-products-loan-provisioning-create` | `/settings/products/provisioning-rules` | Loan provisioning rules | 47% | low coverage, header differs |
| `settings-products-savings` | `/settings/products/savings` | Savings products | 38% | low coverage, header differs, title differs, no search |
| `settings-products-savings-create` | `/settings/products/savings/new` | Create savings product | 41% | low coverage, no add action |
| `settings-products-savings-edit-1` | `/settings/products/savings` | Savings products | 33% | low coverage |
| `settings-role` | `/settings/roles` | Roles | 70% | title differs, no search |
| `settings-service-provider` | `/settings/services` | Services | — | — |
| `transaction-all-transaction` | `/transaction-all-transaction` | All transactions | 50% | low coverage, header differs, no search, no add action |
| `transaction-online-payment-reconciliation` | `/transaction-online-payment-reconciliation` | Reconciliation workspace | 25% | low coverage, header differs, title differs |
| `transaction-online-transaction` | `/transaction-online-transaction` | Online collections | 38% | low coverage, title differs, no search |
| `transaction-teller-transaction` | `/transaction-teller-transaction` | Teller console | 42% | low coverage, header differs |
| `transaction-teller-transaction-history` | `/transaction-teller-transaction-history` | Teller history | 32% | low coverage, header differs, no search |
| `transaction-teller-transaction-request` | `/transaction-teller-transaction-request` | Teller approval request | 10% | low coverage |
