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
  | "settings"
  | "book"
  | "building"
  | "package"
  | "shield"
  | "users"
  | "scroll"
  | "wrench"
  | "file"
  | "landmark"
  | "piggy"
  | "receipt"
  | "card"
  | "clock"
  | "check"
  | "refresh"
  | "box"
  | "library"
  | "scale"
  | "chart";

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

export const navItems: NavItem[] = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { label: "Client", icon: "clients", href: "/clients" },
  {
    label: "Accounts",
    icon: "accounts",
    href: "/accounts",
    chevron: true,
    children: [
      { label: "Loan applications", icon: "file", href: "/account-loan-application" },
      { label: "Loans", icon: "landmark", href: "/account-loan" },
      { label: "Savings", icon: "piggy", href: "/account-saving" },
    ],
  },
  {
    label: "Transactions",
    icon: "transactions",
    href: "/transactions",
    chevron: true,
    children: [
      { label: "All transactions", icon: "receipt", href: "/transaction-all-transaction" },
      { label: "Teller console", icon: "card", href: "/transaction-teller-transaction" },
      { label: "Teller history", icon: "clock", href: "/transaction-teller-transaction-history" },
      { label: "Teller approval request", icon: "check", href: "/transaction-teller-transaction-request" },
      { label: "Online collections", icon: "refresh", href: "/transaction-online-transaction" },
      { label: "Reconciliation", icon: "box", href: "/transaction-online-payment-reconciliation" },
    ],
  },
  {
    label: "Accounting",
    icon: "accounting",
    href: "/accounting",
    chevron: true,
    children: [
      { label: "Chart of accounts", icon: "library", href: "/accounting-chart-of-accounts" },
      { label: "Journal entries", icon: "file", href: "/accounting-entries" },
      { label: "Ledger entries", icon: "scroll", href: "/accounting-ledger-entries" },
      { label: "Asset types", icon: "box", href: "/accounting-assets" },
      { label: "Fixed assets", icon: "building", href: "/accounting-fixed-asset" },
      { label: "Financial reports", icon: "chart", href: "/accounting-reports" },
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
  {
    label: "Reports",
    icon: "reports",
    href: "/reports",
    chevron: true,
    children: [
      { label: "Loan reports", icon: "reports", href: "/reports-loan" },
      { label: "Statements", icon: "file", href: "/reports-statement" },
      { label: "Financial reports", icon: "chart", href: "/accounting-reports" },
    ],
  },
  {
    label: "Import",
    icon: "import",
    href: "/import",
    chevron: true,
    children: [
      { label: "Member batches", icon: "file", href: "/import-member" },
      { label: "Member wizard", icon: "check", href: "/import-member-new" },
      { label: "Account batches", icon: "receipt", href: "/import-account" },
      { label: "Account wizard", icon: "card", href: "/import-account-new" },
      { label: "Transaction batches", icon: "scroll", href: "/import-transaction" },
      { label: "Transaction wizard", icon: "refresh", href: "/import-transaction-new" },
    ],
  },
  { label: "Business Account", icon: "business-account", href: "/business-account" },
  {
    label: "Settings",
    icon: "settings",
    href: "/settings",
    chevron: true,
    children: [
      { label: "General", icon: "settings", href: "/settings/general" },
      { label: "Accounting", icon: "book", href: "/settings/accounting" },
      { label: "Branches", icon: "building", href: "/settings/branches" },
      { label: "Products", icon: "package", href: "/settings/products" },
      { label: "Policies", icon: "shield", href: "/settings/policies" },
      { label: "Users", icon: "users", href: "/settings-administrator" },
      { label: "Roles", icon: "scroll", href: "/settings-role" },
      { label: "Services", icon: "wrench", href: "/settings/services" },
      { label: "System logs", icon: "file", href: "/system-logs" },
    ],
  },
];
