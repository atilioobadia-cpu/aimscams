import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, FileText, Landmark } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = {
  title: "Reports · AIMSCAMS",
};

const sections = [
  { href: "/reports-loan", title: "Loan reports", description: "Portfolio, arrears, risk and disbursements.", icon: Landmark },
  { href: "/reports-statement", title: "Statements", description: "Account, member and transaction statements.", icon: FileText },
  { href: "/accounting-reports", title: "Financial reports", description: "Trial balance, income statement, position and cash flow.", icon: BarChart3 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader title="Reports" description="Operational, portfolio and regulatory returns." breadcrumb="Reports" />
      <div className="grid gap-[var(--space-14)] md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group flex flex-col rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-14)] transition-colors hover:border-brand focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="grid size-10 place-items-center rounded-full bg-accent-teal-bg text-brand">
                <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h2 className="mt-[var(--space-10)] fs-text font-bold text-strong">{section.title}</h2>
              <p className="mt-1 flex-1 fs-text leading-[1.45] text-muted-foreground">{section.description}</p>
              <span className="mt-[var(--space-10)] flex items-center gap-1.5 fs-text font-semibold text-brand">
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
