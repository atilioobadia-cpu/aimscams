import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Info } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

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
  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        variant="card"
        title="Loan Reports"
        icon={<BarChart3 className="size-6 text-primary" aria-hidden="true" />}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reports.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="group flex min-h-[82px] items-center justify-between gap-3 rounded-[var(--card-radius)] border border-card-border bg-surface px-4 py-3 shadow-sm transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <h2 className="fs-text font-semibold text-strong">{report.title}</h2>
            <Info className="size-4 shrink-0 text-label transition-colors group-hover:text-primary" aria-label={`Open ${report.title}`} />
          </Link>
        ))}
      </div>
    </div>
  );
}


