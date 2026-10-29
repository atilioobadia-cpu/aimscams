import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = {
  title: "Statement hub · AIMSCAMS",
};

const reports = [
  { href: "/reports-statement-AccountStatementReport", title: "Account statement" },
  { href: "/reports-statement-MemberStatementReport", title: "Member statement" },
  { href: "/reports-transaction-DailyTransactionReport", title: "Daily transactions" },
  { href: "/reports-transaction-ExpenseReport", title: "Expenses" },
  { href: "/reports-transaction-FeesIncomeReport", title: "Fees income" },
  { href: "/reports-transaction-ReversedTransactionReport", title: "Reversed transactions" },
  { href: "/reports-client-ClientListReport", title: "Client list" },
  { href: "/reports-saving-SavingReport", title: "Savings" },
  { href: "/reports-saving-SavingSnapshotReport", title: "Savings snapshot" },
  { href: "/reports-saving-SavingBeyondPolicyLimitsReport", title: "Beyond policy limits" },
];

export default function StatementHubPage() {
  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader title="Statement hub" description="Account and member statements." breadcrumb="Reports" />
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
