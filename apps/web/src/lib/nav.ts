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
 * Preserve the 12 top-level destinations. Every href resolves: unbuilt modules render
 * the shared ComingSoon page (D-027), so no entry is a dead link.
 */
export const navItems: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { label: "Client", icon: "clients", href: "/clients" },
  {
    label: "Accounts",
    icon: "accounts",
    href: "/accounts",
    chevron: true,
    children: [
      { label: "Loan applications", icon: "accounts", href: "/account-loan-application" },
      { label: "Loans", icon: "accounts", href: "/account-loan" },
      { label: "Savings", icon: "accounts", href: "/account-saving" },
    ],
  },
  {
    label: "Transactions",
    icon: "transactions",
    href: "/transactions",
    chevron: true,
    children: [
      { label: "All transactions", icon: "transactions", href: "/transaction-all-transaction" },
      { label: "Teller console", icon: "transactions", href: "/transaction-teller-transaction" },
      { label: "Teller history", icon: "transactions", href: "/transaction-teller-transaction-history" },
      { label: "Teller approval request", icon: "transactions", href: "/transaction-teller-transaction-request" },
      { label: "Online collections", icon: "transactions", href: "/transaction-online-transaction" },
      { label: "Reconciliation", icon: "transactions", href: "/transaction-online-payment-reconciliation" },
    ],
  },
  {
    label: "Accounting",
    icon: "accounting",
    href: "/accounting",
    chevron: true,
    children: [
      { label: "Chart of accounts", icon: "accounting", href: "/accounting-chart-of-accounts" },
      { label: "Journal entries", icon: "accounting", href: "/accounting-entries" },
      { label: "Ledger entries", icon: "accounting", href: "/accounting-ledger-entries" },
      { label: "Asset types", icon: "accounting", href: "/accounting-assets" },
      { label: "Financial reports", icon: "accounting", href: "/accounting-reports" },
    ],
  },
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
      { label: "Users", icon: "clients", href: "/settings-administrator" },
      { label: "Roles", icon: "settings", href: "/settings-role" },
      { label: "Services", icon: "settings", href: "/settings/services" },
    ],
  },
];
