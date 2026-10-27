import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Library, Scale } from "lucide-react";

import { AccountingNav } from "@/components/accounting/accounting-nav";
import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = {
  title: "Accounting · AIMSCAMS",
};

const sections = [
  {
    href: "/accounting-chart-of-accounts",
    title: "Chart of accounts",
    description:
      "The ledger codes every posting lands on, with each account's type and normal balance.",
    icon: Library,
  },
  {
    href: "/accounting-entries",
    title: "Journal entries",
    description:
      "Browse postings, open their balanced lines, write a manual journal, post a draft or reverse one.",
    icon: BookOpen,
  },
  {
    href: "/accounting-ledger-entries",
    title: "Ledger entries",
    description:
      "Pick one account and follow its opening balance, movements and running balance over a date range.",
    icon: Scale,
  },
];

export default function AccountingPage() {
  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title="Accounting"
        description="The ledger behind every balance: one chart of accounts, append-only journal entries and a per-account ledger."
        breadcrumb="Accounting"
      />

      <AccountingNav />

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
              <h2 className="mt-[var(--space-14)] fs-text font-bold text-strong">
                {section.title}
              </h2>
              <p className="mt-1 flex-1 fs-text leading-[1.45] text-muted-foreground">
                {section.description}
              </p>
              <span className="mt-[var(--space-14)] flex items-center gap-1.5 fs-text font-semibold text-brand">
                Open
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          );
        })}
      </div>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface px-[var(--space-18)] py-[var(--space-14)]">
        <h2 className="fs-text font-bold text-strong">How the ledger behaves</h2>
        <ul className="mt-2 space-y-1 fs-text leading-[1.45] text-muted-foreground">
          <li>Posted entries never change. A correction is a reversal that swaps every debit and credit.</li>
          <li>An entry posts only into an open fiscal period, and drafts can wait inside it.</li>
          <li>Every posting writes its outbox event in the same transaction, so downstream work never misses one.</li>
        </ul>
      </section>
    </div>
  );
}
