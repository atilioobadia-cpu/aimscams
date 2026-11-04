import type { Metadata } from "next";

import { ReportCategoryHub } from "@/components/data/report-category-hub";

export const metadata: Metadata = {
  title: "Loan reports · AIMSCAMS",
};

const reports = [
  { href: "/reports-loan-AccruedInstallmentsReport", title: "Accrued Installments Report" },
  { href: "/reports-loan-AccruedInterestReport", title: "Accrued Interest Report" },
  { href: "/reports-loan-ActiveLoanReport", title: "Active Loan Report" },
  { href: "/reports-loan-AllLoanReport", title: "All Loan Report" },
  { href: "/reports-loan-DeferredInterestReport", title: "Deferred Interest Report" },
  { href: "/reports-loan-ExpectedLoanRepaymentsReport", title: "Expected Loan Repayments Report" },
  { href: "/reports-loan-ExpectedPaymentByDateReport", title: "Expected Payment By Date Report" },
  { href: "/reports-loan-ExpectedRepaymentReport", title: "Expected Repayment Report" },
  { href: "/reports-loan-FeeStatusReport", title: "Fee Status Report" },
  { href: "/reports-loan-GuarantorsReport", title: "Guarantors Report" },
  { href: "/reports-loan-IssuedLoansAndArrearsReport", title: "Issued Loans And Arrears Report" },
  { href: "/reports-loan-LoanAgingReport", title: "Loan Aging Report" },
  { href: "/reports-loan-LoanArrearsReport", title: "Loan Arrears Report" },
  { href: "/reports-loan-LoanDisbursementReport", title: "Loan Disbursement Report" },
  { href: "/reports-loan-LoanInsuranceReport", title: "Loan Insurance Report" },
  { href: "/reports-loan-LoanOfficerIncomeReport", title: "Loan Officer Income Report" },
  { href: "/reports-loan-LoanOutstandingReport", title: "Loan Outstanding Report" },
  { href: "/reports-loan-LoanRepaymentReport", title: "Loan Repayment Report" },
  { href: "/reports-loan-LoanRepaymentScheduleReport", title: "Loan Repayment Schedule Report" },
  { href: "/reports-loan-PaidOffLoansReport", title: "Paid Off Loans Report" },
  { href: "/reports-loan-PendingLoanApplications", title: "Pending Loan Applications" },
  { href: "/reports-loan-PortfolioRiskReport", title: "Portfolio Risk Report" },
  { href: "/reports-loan-RiskClassificationOfAssets", title: "Risk Classification of Assets" },
  { href: "/reports-loan-SummarizedPortfolioAtRiskReport", title: "Summarized Portfolio At Risk Report" },
  { href: "/reports-loan-TransactionReport", title: "Transaction Report" },
  { href: "/reports-loan-WrittenOffLoanReport", title: "Written Off Loan Report" },
];

export default function LoanReportHubPage() {
  return <ReportCategoryHub title="Loan Reports" reports={reports} />;
}


