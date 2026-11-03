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
      { label: "Teller", icon: "card", href: "/transaction-teller-transaction" },
      { label: "Online", icon: "refresh", href: "/transaction-online-transaction" },
      { label: "All", icon: "receipt", href: "/transaction-all-transaction" },
    ],
  },
  {
    label: "Accounting",
    icon: "accounting",
    href: "/accounting",
    chevron: true,
    children: [
      { label: "Chart of accounts", icon: "library", href: "/accounting-chart-of-accounts" },
      { label: "Entries", icon: "file", href: "/accounting-entries" },
      { label: "Ledger entries", icon: "scroll", href: "/accounting-ledger-entries" },
      { label: "Asset Types", icon: "box", href: "/accounting-assets" },
      { label: "Fixed Asset", icon: "building", href: "/accounting-fixed-asset" },
      { label: "Reports", icon: "chart", href: "/accounting-reports" },
    ],
  },
  { label: "Requests", icon: "requests", href: "/requests" },
  { label: "Messages", icon: "messages", href: "/messages" },
  {
    label: "Campaigns",
    icon: "campaigns",
    href: "/campaigns",
    chevron: true,
    children: [
      { label: "Run Campaign", icon: "refresh", href: "/campaigns" },
      { label: "Active Campaigns", icon: "check", href: "/active-campaigns" },
    ],
  },
  {
    label: "Reports",
    icon: "reports",
    href: "/reports",
    chevron: true,
    children: [
      { label: "Loan", icon: "reports", href: "/reports-loan" },
      { label: "Savings", icon: "piggy", href: "/reports-saving" },
      { label: "Transactions", icon: "transactions", href: "/reports-transaction" },
      { label: "Client", icon: "clients", href: "/reports-client" },
      { label: "MSP", icon: "shield", href: "/reports-msp" },
      { label: "Statement", icon: "file", href: "/reports-statement" },
    ],
  },
  {
    label: "Import",
    icon: "import",
    href: "/import",
    chevron: true,
    children: [
      { label: "Member", icon: "file", href: "/import-member" },
      { label: "Account", icon: "receipt", href: "/import-account" },
      { label: "Transaction", icon: "scroll", href: "/import-transaction" },
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
      { label: "Auto Debit", icon: "refresh", href: "/settings/auto-debit" },
      { label: "Users", icon: "users", href: "/settings-administrator" },
      { label: "Roles", icon: "scroll", href: "/settings-role" },
      { label: "Services", icon: "wrench", href: "/settings-service-provider" },
    ],
  },
];
