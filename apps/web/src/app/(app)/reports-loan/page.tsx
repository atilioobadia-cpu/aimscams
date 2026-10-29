import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = {
  title: "Loan reports · AIMSCAMS",
};

const reports = [
  { href: "/reports-loan-ActiveLoanReport", title: "Active loans" },
  { href: "/reports-loan-AllLoanReport", title: "All loans" },
  { href: "/reports-loan-PendingLoanApplications", title: "Pending applications" },
  { href: "/reports-loan-LoanDisbursementReport", title: "Disbursements" },
  { href: "/reports-loan-LoanRepaymentReport", title: "Repayments" },
  { href: "/reports-loan-LoanOutstandingReport", title: "Outstanding" },
  { href: "/reports-loan-LoanArrearsReport", title: "Arrears" },
  { href: "/reports-loan-LoanAgingReport", title: "Aging" },
  { href: "/reports-loan-PortfolioRiskReport", title: "Portfolio risk" },
  { href: "/reports-loan-SummarizedPortfolioAtRiskReport", title: "Portfolio at risk" },
  { href: "/reports-loan-RiskClassificationOfAssets", title: "Risk classification" },
  { href: "/reports-loan-IssuedLoansAndArrearsReport", title: "Issued vs arrears" },
  { href: "/reports-loan-ExpectedLoanRepaymentsReport", title: "Expected repayments" },
  { href: "/reports-loan-ExpectedRepaymentReport", title: "Expected by installment" },
  { href: "/reports-loan-ExpectedPaymentByDateReport", title: "Expected by date" },
  { href: "/reports-loan-AccruedInterestReport", title: "Accrued interest" },
  { href: "/reports-loan-AccruedInstallmentsReport", title: "Accrued installments" },
  { href: "/reports-loan-DeferredInterestReport", title: "Deferred interest" },
  { href: "/reports-loan-FeeStatusReport", title: "Fee status" },
  { href: "/reports-loan-GuarantorsReport", title: "Guarantors" },
  { href: "/reports-loan-LoanInsuranceReport", title: "Loan insurance" },
  { href: "/reports-loan-LoanOfficerIncomeReport", title: "Officer income" },
  { href: "/reports-loan-PaidOffLoansReport", title: "Paid-off loans" },
  { href: "/reports-loan-TransactionReport", title: "Loan transactions" },
  { href: "/reports-loan-WrittenOffLoanReport", title: "Written-off loans" },
];

export default function LoanReportHubPage() {
  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader title="Loan reports" description="The loan portfolio, arrears and risk reports." breadcrumb="Reports" />
      <div className="grid gap-[var(--space-10)] md:grid-cols-2 xl:grid-cols-4">
        {reports.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="group flex items-center justify-between rounded-[var(--card-radius)] border border-card-border bg-card px-[var(--space-14)] py-[var(--space-10)] transition-colors hover:border-brand focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="flex items-center gap-2 fs-text font-medium text-strong">
              <FileText className="size-4 text-brand" aria-hidden="true" />
              {report.title}
            </span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
