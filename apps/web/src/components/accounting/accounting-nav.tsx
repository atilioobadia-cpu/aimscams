"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

const links = [
  { href: "/accounting", label: "Overview" },
  { href: "/accounting-chart-of-accounts", label: "Chart of accounts" },
  { href: "/accounting-entries", label: "Journal entries" },
  { href: "/accounting-ledger-entries", label: "Ledger entries" },
];

export function AccountingNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Accounting sections"
      className="flex flex-wrap items-center gap-1 border-b border-border"
    >
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex h-8 items-center rounded-t-[6px] border-b-2 px-[var(--space-10)] text-fs transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              active
                ? "border-brand font-semibold text-brand"
                : "border-transparent text-muted-foreground hover:text-strong",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
