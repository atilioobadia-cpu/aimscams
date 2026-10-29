# System audit (Phase 1)

Generated 2026-10-29T16:33:52.838Z from `docs/audit/route-crawl.json` (crawl of http://localhost:3000, viewport 1280x800).

## Summary

- Routes crawled: 156 (141 static, 15 dynamic)
- Dynamic routes crawled with a real record id: 15 of 15
- OK: 78
- In build (placeholder): 73
- Buggy: 0
- Not linked from the sidebar: 112

Severity: **High** = placeholder or broken page that users reach from the sidebar; **Medium** = page works but has a defect (console, API, overflow); **Low** = orphan route or cosmetic. Pages with no defect and linked from the sidebar are not listed as issues.

## Every route

| Route | Linked | Heading (h1) | Status | Exact problem | Severity |
| --- | --- | --- | --- | --- | --- |
| `/account-loan` | Yes | Loans | OK | None | None |
| `/account-loan-application` | Yes | Loan applications | OK | None | None |
| `/account-loan-application-create` | No | New loan application | OK | None | Low |
| `/account-saving` | Yes | Savings accounts | OK | None | None |
| `/accounting` | Yes | Accounting | OK | None | None |
| `/accounting-assets` | Yes | Asset types | OK | None | None |
| `/accounting-chart-of-accounts` | Yes | Chart of accounts | OK | None | None |
| `/accounting-entries` | Yes | Journal entries | OK | None | None |
| `/accounting-fixed-asset` | Yes | Fixed asset register | OK | None | None |
| `/accounting-ledger-entries` | Yes | Ledger entries | OK | None | None |
| `/accounting-reports` | Yes | Financial reports | OK | None | None |
| `/accounting-reports-Assets` | No | Assets | In build | Placeholder text: in build | Medium |
| `/accounting-reports-CashBook` | No | Cash book | OK | None | Low |
| `/accounting-reports-CashFlowStatement` | No | Cash flow statement | OK | None | Low |
| `/accounting-reports-ComprehensiveTrialBalance` | No | ComprehensiveTrialBalance | In build | Placeholder text: in build | Medium |
| `/accounting-reports-CorporateTaxStatement` | No | CorporateTaxStatement | In build | Placeholder text: in build | Medium |
| `/accounting-reports-FinancialPositionReport` | No | Financial position | OK | None | Low |
| `/accounting-reports-GeneralLedgerBook` | No | General ledger book | OK | None | Low |
| `/accounting-reports-IncomeStatementReport` | No | Income statement | OK | None | Low |
| `/accounting-reports-JournalBook` | No | Journal book | OK | None | Low |
| `/accounting-reports-LedgerStatementReport` | No | LedgerStatementReport | In build | Placeholder text: in build | Medium |
| `/accounting-reports-MonthlyTrialBalance` | No | MonthlyTrialBalance | In build | Placeholder text: in build | Medium |
| `/accounting-reports-OwnersEquity` | No | OwnersEquity | In build | Placeholder text: in build | Medium |
| `/accounting-reports-Reconciliation` | No | Reconciliation | In build | Placeholder text: in build | Medium |
| `/accounting-reports-TrialBalanceReport` | No | Trial balance | OK | None | Low |
| `/accounting-reports-notes-of-account` | No | notes of account | In build | Placeholder text: in build | Medium |
| `/accounting-reports-reconcile-statement` | No | reconcile statement | In build | Placeholder text: in build | Medium |
| `/accounting-reports-reconcile-statement-settings` | No | reconcile statement settings | In build | Placeholder text: in build | Medium |
| `/accounts` | Yes | Accounts | OK | None | None |
| `/business-account` | Yes | Business account | In build | Placeholder text: in build | High |
| `/campaigns` | Yes | Campaigns | In build | Placeholder text: in build | High |
| `/clients` | Yes | Clients | OK | None | None |
| `/clients/create` | No | Add client | OK | None | Low |
| `/clients/create-group` | No | Add group | OK | None | Low |
| `/dashboard` | Yes | N/A | OK | None | None |
| `/import` | Yes | Import | In build | Placeholder text: in build | High |
| `/import-account` | Yes | Account import batches | OK | None | None |
| `/import-account-new` | Yes | Account import wizard | OK | None | None |
| `/import-member` | Yes | Member import batches | OK | None | None |
| `/import-member-new` | Yes | Member import wizard | OK | None | None |
| `/import-transaction` | Yes | Transaction import batches | OK | None | None |
| `/import-transaction-new` | Yes | Transaction import wizard | OK | None | None |
| `/messages` | Yes | Messages | In build | Placeholder text: in build | High |
| `/messages-message-logs` | No | Delivery logs | OK | None | Low |
| `/messages-recharge-credits` | No | Recharge credits | In build | Placeholder text: in build | Medium |
| `/messages-segment-list` | No | Segments | In build | Placeholder text: in build | Medium |
| `/messages-segment-list-create` | No | Create segment | In build | Placeholder text: in build | Medium |
| `/messages-send-message` | No | Send message | OK | None | Low |
| `/messages-template-list` | No | Templates | OK | None | Low |
| `/messages-users-list` | No | Message users | In build | Placeholder text: in build | Medium |
| `/reports` | Yes | Reports | OK | None | None |
| `/reports-client-ClientListReport` | No | client ClientListReport | In build | Placeholder text: in build | Medium |
| `/reports-client-MemberVerificationReport` | No | client MemberVerificationReport | In build | Placeholder text: in build | Medium |
| `/reports-loan` | Yes | Loan reports | OK | None | None |
| `/reports-loan-AccruedInstallmentsReport` | No | loan AccruedInstallmentsReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-AccruedInterestReport` | No | loan AccruedInterestReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-ActiveLoanReport` | No | loan ActiveLoanReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-AllLoanReport` | No | loan AllLoanReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-DeferredInterestReport` | No | loan DeferredInterestReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-ExpectedLoanRepaymentsReport` | No | loan ExpectedLoanRepaymentsReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-ExpectedPaymentByDateReport` | No | loan ExpectedPaymentByDateReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-ExpectedRepaymentReport` | No | loan ExpectedRepaymentReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-FeeStatusReport` | No | loan FeeStatusReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-GuarantorsReport` | No | loan GuarantorsReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-IssuedLoansAndArrearsReport` | No | loan IssuedLoansAndArrearsReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-LoanAgingReport` | No | loan LoanAgingReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-LoanArrearsReport` | No | loan LoanArrearsReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-LoanDisbursementReport` | No | loan LoanDisbursementReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-LoanInsuranceReport` | No | loan LoanInsuranceReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-LoanOfficerIncomeReport` | No | loan LoanOfficerIncomeReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-LoanOutstandingReport` | No | loan LoanOutstandingReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-LoanRepaymentReport` | No | loan LoanRepaymentReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-PaidOffLoansReport` | No | loan PaidOffLoansReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-PendingLoanApplications` | No | loan PendingLoanApplications | In build | Placeholder text: in build | Medium |
| `/reports-loan-PortfolioRiskReport` | No | loan PortfolioRiskReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-RiskClassificationOfAssets` | No | loan RiskClassificationOfAssets | In build | Placeholder text: in build | Medium |
| `/reports-loan-SummarizedPortfolioAtRiskReport` | No | loan SummarizedPortfolioAtRiskReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-TransactionReport` | No | loan TransactionReport | In build | Placeholder text: in build | Medium |
| `/reports-loan-WrittenOffLoanReport` | No | loan WrittenOffLoanReport | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP01Report` | No | msp MSP01Report | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP02Report` | No | msp MSP02Report | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP03MFIReport` | No | msp MSP03MFIReport | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP03Type1Report` | No | msp MSP03Type1Report | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP03Type2Report` | No | msp MSP03Type2Report | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP04MFIReport` | No | msp MSP04MFIReport | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP04Report` | No | msp MSP04Report | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP05MFIReport` | No | msp MSP05MFIReport | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP05Report` | No | msp MSP05Report | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP06Report` | No | msp MSP06Report | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP07Report` | No | msp MSP07Report | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP08Report` | No | msp MSP08Report | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP09MFIReport` | No | msp MSP09MFIReport | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP09Report` | No | msp MSP09Report | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP10MFIReport` | No | msp MSP10MFIReport | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP10Report` | No | msp MSP10Report | In build | Placeholder text: in build | Medium |
| `/reports-msp-MSP11Report` | No | msp MSP11Report | In build | Placeholder text: in build | Medium |
| `/reports-saving-SavingBeyondPolicyLimitsReport` | No | saving SavingBeyondPolicyLimitsReport | In build | Placeholder text: in build | Medium |
| `/reports-saving-SavingReport` | No | saving SavingReport | In build | Placeholder text: in build | Medium |
| `/reports-saving-SavingSnapshotReport` | No | saving SavingSnapshotReport | In build | Placeholder text: in build | Medium |
| `/reports-statement` | Yes | Statement hub | OK | None | None |
| `/reports-statement-AccountStatementReport` | No | statement AccountStatementReport | In build | Placeholder text: in build | Medium |
| `/reports-statement-MemberStatementReport` | No | statement MemberStatementReport | In build | Placeholder text: in build | Medium |
| `/reports-transaction-DailyTransactionReport` | No | transaction DailyTransactionReport | In build | Placeholder text: in build | Medium |
| `/reports-transaction-ExpenseReport` | No | transaction ExpenseReport | In build | Placeholder text: in build | Medium |
| `/reports-transaction-FeesIncomeReport` | No | transaction FeesIncomeReport | In build | Placeholder text: in build | Medium |
| `/reports-transaction-ReversedTransactionReport` | No | transaction ReversedTransactionReport | In build | Placeholder text: in build | Medium |
| `/requests` | Yes | Request centre | OK | None | None |
| `/settings` | Yes | General | Redirect | redirects to /settings/general | None |
| `/settings-administrator` | Yes | Users | OK | None | None |
| `/settings-administrator-add` | No | Users | Redirect | redirects to /settings-administrator | None |
| `/settings-role` | Yes | Roles | OK | None | None |
| `/settings-service-provider` | No | Service providers | In build | Placeholder text: in build | Medium |
| `/settings/accounting` | Yes | Accounting settings | OK | None | None |
| `/settings/branches` | Yes | Branches | OK | None | None |
| `/settings/branches/new` | No | Add branch | OK | None | Low |
| `/settings/general` | Yes | General | OK | None | None |
| `/settings/policies` | Yes | Policies | In build | Placeholder text: in build | High |
| `/settings/policies/credit-product` | No | Credit product policies | OK | None | Low |
| `/settings/policies/credit-product/new` | No | Create credit product policy | OK | None | Low |
| `/settings/policies/holidays` | No | Holiday calendar | OK | None | Low |
| `/settings/policies/membership` | No | Membership policies | OK | None | Low |
| `/settings/policies/membership/new` | No | Create membership policy | OK | None | Low |
| `/settings/products` | Yes | Loan products | Redirect | redirects to /settings/products/loan | None |
| `/settings/products/fee-penalties` | No | Fees and penalties | OK | None | Low |
| `/settings/products/interest-rates` | No | Interest rates | OK | None | Low |
| `/settings/products/interest-rates/new` | No | Create interest rate | OK | None | Low |
| `/settings/products/loan` | No | Loan products | OK | None | Low |
| `/settings/products/provisioning-rules` | No | Loan provisioning rules | OK | None | Low |
| `/settings/products/savings` | No | Savings products | OK | None | Low |
| `/settings/products/savings/new` | No | Create savings product | OK | None | Low |
| `/settings/roles` | No | Roles | Redirect | redirects to /settings-role | None |
| `/settings/services` | Yes | Services | OK | None | None |
| `/settings/users` | No | Users | Redirect | redirects to /settings-administrator | None |
| `/system-logs` | Yes | System logs | OK | None | None |
| `/transaction-all-transaction` | Yes | All transactions | OK | None | None |
| `/transaction-online-payment-reconciliation` | Yes | Reconciliation workspace | OK | None | None |
| `/transaction-online-transaction` | Yes | Online collections | OK | None | None |
| `/transaction-teller-transaction` | Yes | Teller console | OK | None | None |
| `/transaction-teller-transaction-history` | Yes | Teller history | OK | None | None |
| `/transaction-teller-transaction-request` | Yes | Teller approval request | OK | None | None |
| `/transactions` | Yes | All transactions | OK | None | None |
| `/account-loan-application-details/[id]` | No | Loan application 000007 | OK | None | Low |
| `/account-loan-application-edit/[id]` | No | Edit loan application | OK | None | Low |
| `/account-loan-details/[id]` | No | Loan 000001 | OK | None | Low |
| `/account-loan-details/[id]/documents` | No | Documents · 000001 | OK | None | Low |
| `/account-loan-details/[id]/guarantors` | No | Guarantors · 000001 | OK | None | Low |
| `/account-loan-details/[id]/repayments` | No | Repayment history · 000001 | OK | None | Low |
| `/account-loan-details/[id]/transactions` | No | Transactions · 000001 | OK | None | Low |
| `/clients/[id]` | No | CL-001 — Amina Hassan Mwinyi | OK | None | Low |
| `/settings/branches/[id]` | No | Mwanza Branch | OK | None | Low |
| `/settings/policies/credit-product/[id]` | No | CPP-STD — Standard credit policy | OK | None | Low |
| `/settings/policies/credit-product/[id]/edit` | No | Edit credit product policy | OK | None | Low |
| `/settings/policies/membership/[id]` | No | MP-STD — Standard membership | OK | None | Low |
| `/settings/policies/membership/[id]/edit` | No | Edit membership policy | OK | None | Low |
| `/settings/products/loan/[id]` | No | LP-STAFF — Staff Loan | OK | None | Low |
| `/settings/products/savings/[id]` | No | Edit savings product | OK | None | Low |

## Dynamic routes not crawled

None. Every dynamic route was tested with a real record.
