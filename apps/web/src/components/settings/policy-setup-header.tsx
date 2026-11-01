import Link from "next/link";

const policyTabs = [
  { id: "membership", label: "Membership Policy", href: "/settings/policies/membership" },
  { id: "credit-product", label: "Credit Product Policy", href: "/settings/policies/credit-product" },
  { id: "holidays", label: "Holidays", href: "/settings/policies/holidays" },
] as const;

export function PolicySetupHeader({ active }: { active: (typeof policyTabs)[number]["id"] }) {
  return (
    <nav aria-label="Policy settings" className="flex min-h-[54px] items-stretch border-b border-chrome bg-card">
      {policyTabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={selected ? "page" : undefined}
            className={`flex items-center border-b-2 px-4 fs-text ${selected ? "border-primary font-semibold text-primary" : "border-transparent text-label hover:text-primary"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
