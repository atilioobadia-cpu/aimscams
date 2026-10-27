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

export type NavChild = {
  label: string;
  icon: NavIcon;
  href: string;
};

export type NavItem = {
  label: string;
  icon: NavIcon;
  href?: string;
  chevron?: boolean;
  disabled?: boolean;
  badge?: string;
  children?: NavChild[];
};

/**
 * Preserve the 12 top-level destinations. Settings exposes only its built routes.
 * Campaigns stays present for geometry but is never a link (D-015).
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
    href: "/campaigns",
    badge: "Soon",
  },
  { label: "Reports", icon: "reports", href: "/reports", chevron: true },
  { label: "Import", icon: "import", href: "/import", chevron: true },
  { label: "Business Account", icon: "business-account", href: "/business-account" },
  {
    label: "Settings",
    icon: "settings",
    href: "/settings",
    chevron: true,
    children: [
      { label: "General", icon: "settings", href: "/settings/general" },
      { label: "Accounting", icon: "settings", href: "/settings/accounting" },
      { label: "Branches", icon: "settings", href: "/settings/branches" },
      { label: "Products", icon: "settings", href: "/settings/products" },
      { label: "Policies", icon: "settings", href: "/settings/policies" },
      { label: "Users", icon: "clients", href: "/settings/users" },
      { label: "Roles", icon: "settings", href: "/settings/roles" },
      { label: "Services", icon: "settings", href: "/settings/services" },
    ],
  },
];
