export type NavIcon =
  | "dashboard"
  | "clients"
  | "accounts"
  | "transactions"
  | "accounting"
  | "requests"
  | "messages"
  | "campaigns"
  | "reports"
  | "import"
  | "business-account"
  | "settings";

export type NavItem = {
  label: string;
  icon: NavIcon;
  href?: string;
  chevron?: boolean;
  disabled?: boolean;
  badge?: string;
};

/**
 * D-024: twelve flat items in the measured order. Campaigns stays present for
 * geometry but is never a link (D-015).
 */
export const navItems: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { label: "Client", icon: "clients", href: "/clients" },
  { label: "Accounts", icon: "accounts", href: "/accounts", chevron: true },
  { label: "Transactions", icon: "transactions", href: "/transactions", chevron: true },
  { label: "Accounting", icon: "accounting", href: "/accounting", chevron: true },
  { label: "Requests", icon: "requests", href: "/requests" },
  { label: "Messages", icon: "messages", href: "/messages" },
  {
    label: "Campaigns",
    icon: "campaigns",
    chevron: true,
    disabled: true,
    badge: "Soon",
  },
  { label: "Reports", icon: "reports", href: "/reports", chevron: true },
  { label: "Import", icon: "import", href: "/import", chevron: true },
  { label: "Business Account", icon: "business-account", href: "/business-account" },
  { label: "Settings", icon: "settings", href: "/settings", chevron: true },
];
