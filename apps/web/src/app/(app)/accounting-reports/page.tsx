import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, Scale } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = {
  title: "Financial reports · AIMSCAMS",
};

const sections = [
  { href: "/accounting-reports-TrialBalanceReport", title: "Trial balance", description: "Debits and credits by account for a period.", icon: Scale },
  { href: "/accounting-reports-IncomeStatementReport", title: "Income statement", description: "Revenue, expenses and net result for a period.", icon: BarChart3 },
  { href: "/accounting-reports-FinancialPositionReport", title: "Financial position", description: "Assets, liabilities and equity at a point in time.", icon: BookOpen },
  { href: "/accounting-reports-CashFlowStatement", title: "Cash flow statement", description: "Operating, investing and financing cash movements.", icon: BarChart3 },
  { href: "/accounting-reports-GeneralLedgerBook", title: "General ledger book", description: "All postings by account over a date range.", icon: BookOpen },
  { href: "/accounting-reports-JournalBook", title: "Journal book", description: "All journal entries in date order.", icon: BookOpen },
  { href: "/accounting-reports-CashBook", title: "Cash book", description: "Cash receipts and payments.", icon: BookOpen },
  { href: "/accounting-reports-LedgerStatementReport", title: "Ledger statement", description: "Per-account statement with running balance.", icon: BookOpen },
  { href: "/accounting-reports-ComprehensiveTrialBalance", title: "Comprehensive trial balance", description: "Trial balance with comparatives.", icon: Scale },
  { href: "/accounting-reports-MonthlyTrialBalance", title: "Monthly trial balance", description: "Trial balance by month.", icon: Scale },
  { href: "/accounting-reports-OwnersEquity", title: "Owner's equity", description: "Changes in equity over a period.", icon: BarChart3 },
  { href: "/accounting-reports-Assets", title: "Assets", description: "Asset register summary.", icon: BookOpen },
  { href: "/accounting-reports-notes-of-account", title: "Notes of account", description: "Disclosures and notes.", icon: BookOpen },
  { href: "/accounting-reports-CorporateTaxStatement", title: "Corporate tax statement", description: "Tax computation.", icon: BookOpen },
  { href: "/accounting-reports-Reconciliation", title: "Reconciliation", description: "Bank and control account reconciliation.", icon: BookOpen },
];

export default function FinancialReportsHubPage() {
  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title="Financial reports"
        description="The financial statements and books behind every balance."
        breadcrumb="Accounting"
      />

      <div className="grid gap-[var(--space-14)] md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group flex flex-col rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-18)] transition-colors hover:border-brand focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="grid size-10 place-items-center rounded-full bg-accent-teal-bg text-brand">
                <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h2 className="mt-[var(--space-14)] fs-text font-bold text-strong">{section.title}</h2>
              <p className="mt-1 flex-1 fs-text leading-[1.45] text-muted-foreground">{section.description}</p>
              <span className="mt-[var(--space-14)] flex items-center gap-1.5 fs-text font-semibold text-brand">
                Open
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
