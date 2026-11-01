"use client";

import Link from "next/link";
import { Box } from "lucide-react";

const sections = [
  { id: "loan", label: "Loan Product", href: "/settings/products/loan" },
  { id: "savings", label: "Savings Product", href: "/settings/products/savings" },
  { id: "interest-rates", label: "Interest Rate", href: "/settings/products/interest-rates" },
  { id: "fee-penalties", label: "Fee & Penalties", href: "/settings/products/fee-penalties" },
  { id: "provisioning-rules", label: "Loan Provisioning", href: "/settings/products/provisioning-rules" },
] as const;

export function ProductSetupHeader({ active }: { active: (typeof sections)[number]["id"] }) {
  return (
    <>
      <section className="flex min-h-[80px] shrink-0 items-center rounded-[var(--card-radius)] border border-card-border bg-card px-[var(--space-24)] shadow-sm">
        <Box className="mr-4 size-6 text-primary" strokeWidth={1.8} aria-hidden="true" />
        <h1 className="fs-title font-semibold text-heading">Product Setup</h1>
      </section>
      <nav aria-label="Product setup sections" className="flex min-h-[56px] flex-wrap items-stretch border-b border-card-border bg-card">
        {sections.map((section) => {
          const selected = active === section.id;
          return (
            <Link
              key={section.id}
              href={section.href}
              aria-current={selected ? "page" : undefined}
              className={`inline-flex items-center border-b-2 px-4 fs-text font-medium transition-colors hover:bg-subtle/70 hover:text-primary ${selected ? "border-primary bg-subtle/60 text-primary" : "border-transparent text-body"}`}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
