import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Landmark, PiggyBank, Receipt } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";

export const metadata: Metadata = {
  title: "Accounts · AIMSCAMS",
};

const sections = [
  {
    href: "/account-loan-application",
    title: "Loan applications",
    description: "Draft, submit and review loan applications before they become accounts.",
    icon: Receipt,
  },
  {
    href: "/account-loan",
    title: "Loans",
    description: "Loan accounts created from approved applications, with schedules and balances.",
    icon: Landmark,
  },
  {
    href: "/account-saving",
    title: "Savings",
    description: "Savings and share accounts held by clients.",
    icon: PiggyBank,
  },
];

export default function AccountsPage() {
  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title="Accounts"
        description="Client accounts: loan applications, loans and savings."
        breadcrumb="Accounts"
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
    </div>
  );
}
