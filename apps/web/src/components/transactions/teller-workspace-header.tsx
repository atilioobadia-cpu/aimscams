import Link from "next/link";
import { Wallet } from "lucide-react";

import { formatTzs, formatMinorUnitsExact } from "@/lib/format";
import type { TillInfo } from "@/lib/transactions";

type TellerWorkspaceTab = "new" | "history" | "requests";

const TABS: { id: TellerWorkspaceTab; label: string; href: string }[] = [
  { id: "new", label: "New Transaction", href: "/transaction-teller-transaction" },
  { id: "history", label: "History", href: "/transaction-teller-transaction-history" },
  { id: "requests", label: "Requests", href: "/transaction-teller-transaction-request" },
];

export function TellerWorkspaceHeader({
  till,
  activeTab,
}: {
  till: TillInfo | null;
  activeTab: TellerWorkspaceTab;
}) {
  const isOpen = till?.session?.status === "OPEN";

  return (
    <div className="space-y-3">
      <section className="flex min-h-[86px] flex-wrap items-center justify-between gap-4 rounded-[var(--card-radius)] border border-card-border bg-surface px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Wallet className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="fs-title font-semibold leading-tight text-heading">Teller Transaction</h1>
            <p className="mt-1 fs-text text-muted-foreground">
              <span className={isOpen ? "font-semibold text-accent-teal" : "font-semibold text-accent-red"}>
                {isOpen ? "Open" : "Closed"}
              </span>
              <span className="mx-1.5 text-muted-foreground">·</span>
              <span className="font-mono text-muted-foreground">1010</span>
            </p>
          </div>
        </div>
        <div className="flex min-w-[300px] items-center justify-end gap-12">
          <div className="min-w-[120px] text-left">
            <p className="fs-caption font-semibold uppercase tracking-wide text-label">Branch status</p>
            <p className="mt-1 fs-text font-semibold text-primary">Open</p>
          </div>
          <div className="min-w-[140px] text-left">
            <p className="fs-caption font-semibold uppercase tracking-wide text-label">Balance</p>
            <p className="mt-1 fs-text font-semibold text-primary">
              {till?.session?.systemBalanceMinor
                ? `DR ${formatMinorUnitsExact(till.session.systemBalanceMinor)}`
                : "Unavailable"}
            </p>
          </div>
        </div>
      </section>

      <nav aria-label="Teller transaction sections" className="flex min-h-[44px] items-stretch overflow-x-auto rounded-[var(--card-radius)] bg-subtle">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-11 shrink-0 items-center justify-center border-b-2 px-[16.8px] fs-text font-bold transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none ${
                active ? "border-primary bg-surface text-primary" : "border-transparent text-muted-foreground hover:text-primary"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
