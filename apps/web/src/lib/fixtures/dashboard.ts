export type KpiAccent = "teal" | "red" | "yellow";

export type KpiIcon =
  | "members"
  | "principal"
  | "arrears-principal"
  | "arrears-clients"
  | "portfolio-risk"
  | "savings"
  | "till"
  | "unposted";

export type KpiFormat = "integer" | "money" | "percent" | "text";

export type KpiFixture = {
  id: string;
  label: string;
  value: string;
  format: KpiFormat;
  accent: KpiAccent;
  icon: KpiIcon;
  hint?: string;
};

export type UnpostedItem = {
  reference: string;
  kind: string;
  amount: string;
  age: string;
};

export type DashboardFixture = {
  asOf: string;
  institution: {
    name: string;
    code: string;
    dialect: string;
  };
  branch: {
    name: string;
    code: string;
    status: "Open" | "Closed";
  };
  user: {
    name: string;
    initials: string;
    role: string;
  };
  unposted: {
    count: number;
    oldestAge: string;
    items: UnpostedItem[];
  };
  kpis: KpiFixture[];
  funds: {
    title: string;
    period: string;
    axis: {
      min: string;
      max: string;
      step: string;
    };
    series: Array<{
      id: string;
      label: string;
      value: string;
      tone: "in" | "out";
    }>;
  };
  portfolio: {
    title: string;
    total: string;
    segments: Array<{
      id: string;
      label: string;
      value: string;
      tone: "teal" | "tenant" | "logo" | "yellow";
    }>;
  };
};

/**
 * Synthetic fixtures. The values reconcile with one another: PAR is principal in
 * arrears over outstanding principal, and portfolio segments sum to the total.
 * Amounts are TZS minor units.
 */
export const dashboardFixture: DashboardFixture = {
  asOf: "26 October 2026 · 09:42 EAT",
  institution: {
    name: "AIMSCAMS Demo SACCO",
    code: "TEST-001",
    dialect: "TCDC",
  },
  branch: {
    name: "Mwanza Demo Branch",
    code: "MWZ-01",
    status: "Open",
  },
  user: {
    name: "Demo User",
    initials: "DU",
    role: "Branch administrator",
  },
  unposted: {
    count: 3,
    oldestAge: "2 days",
    items: [
      {
        reference: "UP-1042",
        kind: "Loan repayment",
        amount: "85000000",
        age: "2 days",
      },
      {
        reference: "UP-1041",
        kind: "Savings deposit",
        amount: "12500000",
        age: "1 day",
      },
      {
        reference: "UP-1039",
        kind: "Share purchase",
        amount: "5000000",
        age: "4 hours",
      },
    ],
  },
  kpis: [
    {
      id: "total-members",
      label: "Total Members",
      value: "1111",
      format: "integer",
      accent: "teal",
      icon: "members",
      hint: "Active and dormant",
    },
    {
      id: "outstanding-principal",
      label: "Outstanding Loan Principal",
      value: "9371539600",
      format: "money",
      accent: "red",
      icon: "principal",
      hint: "Across 284 open loans",
    },
    {
      id: "principal-in-arrears",
      label: "Principal in Arrears",
      value: "1618041600",
      format: "money",
      accent: "yellow",
      icon: "arrears-principal",
      hint: "61 borrowers past due",
    },
    {
      id: "clients-in-arrears",
      label: "Clients in Arrears",
      value: "23",
      format: "integer",
      accent: "red",
      icon: "arrears-clients",
      hint: "Over 30 days past due",
    },
    {
      id: "portfolio-at-risk",
      label: "Portfolio at Risk",
      value: "17.3",
      format: "percent",
      accent: "red",
      icon: "portfolio-risk",
      hint: "Principal, 30+ days",
    },
    {
      id: "savings-shares",
      label: "Savings & Shares Balance",
      value: "4120890000",
      format: "money",
      accent: "teal",
      icon: "savings",
      hint: "Member deposits and shares",
    },
    {
      id: "till-status",
      label: "Till Status",
      value: "Open",
      format: "text",
      accent: "teal",
      icon: "till",
      hint: "TZS 4,820,500 cash on hand",
    },
    {
      id: "unposted",
      label: "Unposted Transactions",
      value: "3",
      format: "integer",
      accent: "yellow",
      icon: "unposted",
      hint: "Awaiting posting",
    },
  ],
  funds: {
    title: "FundsInVsFundsOut",
    period: "October 2026",
    axis: {
      min: "1500000000",
      max: "5000000000",
      step: "500000000",
    },
    series: [
      { id: "funds-in", label: "Funds in", value: "4750000000", tone: "in" },
      { id: "funds-out", label: "Funds out", value: "3825000000", tone: "out" },
    ],
  },
  portfolio: {
    title: "Portfolio composition",
    total: "14750000000",
    segments: [
      { id: "loans", label: "Loan principal", value: "9371539600", tone: "teal" },
      { id: "savings", label: "Savings", value: "4120890000", tone: "tenant" },
      { id: "shares", label: "Shares", value: "845000000", tone: "logo" },
      { id: "cash", label: "Cash & bank", value: "412570400", tone: "yellow" },
    ],
  },
};
