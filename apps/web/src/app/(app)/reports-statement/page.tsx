import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Info } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = {
  title: "Statement Reports · AIMSCAMS",
};

const reports = [
  { href: "/reports-statement-AccountStatementReport", title: "Account Statement Report" },
  { href: "/reports-statement-MemberStatementReport", title: "Member Statement Report" },
];

export default function StatementHubPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        variant="card"
        title="Statement Reports"
        icon={<BarChart3 className="size-6 text-primary" aria-hidden="true" />}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
