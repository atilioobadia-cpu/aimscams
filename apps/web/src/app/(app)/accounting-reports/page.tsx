import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Info } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = {
  title: "Financial reports · AIMSCAMS",
};

const sections = [
  { href: "/accounting-reports-TrialBalanceReport", title: "Trial Balance Report" },
  { href: "/accounting-reports-ComprehensiveTrialBalance", title: "Comprehensive Trial Balance" },
  { href: "/accounting-reports-IncomeStatementReport", title: "Income Statement Report" },
  { href: "/accounting-reports-LedgerStatementReport", title: "Ledger Statement Report" },
  { href: "/accounting-reports-FinancialPositionReport", title: "Financial Position Report" },
  { href: "/accounting-reports-MonthlyTrialBalance", title: "Monthly Trial Balance" },
  { href: "/accounting-reports-notes-of-account", title: "Notes of Account" },
  { href: "/accounting-reports-CashFlowStatement", title: "Cash Flow Statement" },
  { href: "/accounting-reports-Assets", title: "Assets" },
  { href: "/accounting-reports-CashBook", title: "Cash Book" },
  { href: "/accounting-reports-JournalBook", title: "Journal Book" },
  { href: "/accounting-reports-OwnersEquity", title: "Owner's Equity" },
  { href: "/accounting-reports-GeneralLedgerBook", title: "General Ledger Book" },
  { href: "/accounting-reports-Reconciliation", title: "Reconciliation" },
  { href: "/accounting-reports-CorporateTaxStatement", title: "Corporate Tax Statement" },
];

export default function FinancialReportsHubPage() {
  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader variant="card" title="Accounting Reports" icon={<BarChart3 className="size-6 text-primary" aria-hidden="true" />} />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => {
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group flex min-h-[64px] items-center justify-between gap-3 rounded-[var(--card-radius)] border border-card-border bg-surface px-3 py-3 shadow-sm transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <h2 className="fs-text font-semibold text-strong">{section.title}</h2>
              <Info className="size-4 shrink-0 text-label transition-colors group-hover:text-primary" aria-label={`Open ${section.title}`} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
