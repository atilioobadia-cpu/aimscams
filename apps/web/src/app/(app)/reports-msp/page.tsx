import type { Metadata } from "next";

import { ReportCategoryHub } from "@/components/data/report-category-hub";

export const metadata: Metadata = { title: "Msp Reports · AIMSCAMS" };

const reports = [
  {
    href: "/reports-msp-MSP01Report",
    title: "MSP01 Report",
    description: "Provides a snapshot as of the selected date of short/medium/long-term loans, investments, and balances across assets and liabilities, plus P&L.",
  },
  {
    href: "/reports-msp-MSP02Report",
    title: "MSP02 Report",
    description: "Provides a monthly profit and loss snapshot as of the selected date from accounting categories, showing current vs. prior month totals.",
  },
  {
    href: "/reports-msp-MSP03MFIReport",
    title: "MSP03 MFI Report",
    description: "Provides the loan portfolio aging by economic sector, classifying outstanding by overdue days (current, 6-30, 31-60, 61-90, >90) with write-offs, totals, provisioning rates/amounts, net amounts, and the NPL ratio as of the selected year and quarter.",
  },
  {
    href: "/reports-msp-MSP03Type1Report",
    title: "MSP03 Type1 Report",
    description: "Provides sector subtotals and grand totals with provisioning summary lines (gross loans, provision rates/amounts, less cash collateral/insurance/compulsory savings, and net amounts).",
  },
  {
    href: "/reports-msp-MSP03Type2Report",
    title: "MSP03 Type2 Report",
    description: "Provides loan aging by sector/subsector using first-due-date, showing borrower counts, outstanding, aging buckets, write-offs, and collateral/guarantee totals.",
  },
  {
    href: "/reports-msp-MSP04MFIReport",
    title: "MSP04 MFI Report",
    description: "This report summarises the number of borrowers and outstanding loan amounts by type of microfinance loans, including weighted average and range of straight-line and reducing-balance interest rates.",
  },
  {
    href: "/reports-msp-MSP04Report",
    title: "MSP04 Report",
    description: "Provides insights into various aspects of loans, such as interest rates, loan statuses, and borrower information.",
  },
  {
    href: "/reports-msp-MSP05MFIReport",
    title: "MSP05 MFI Report",
    description: "This report computes the institutions liquidity position by detailing liquid asset components, total assets, required minimum liquid assets and the resulting liquidity ratios.",
  },
  {
    href: "/reports-msp-MSP05Report",
    title: "MSP05 Report",
    description: "Provide a comprehensive view of loan disbursements, segmented by various criteria, which can be used for financial analysis and decision-making.",
  },
  {
    href: "/reports-msp-MSP06Report",
    title: "MSP06 Report",
    description: "This report presents insider lending by related-party category, showing number of loans, principal amounts and collateral coverage from members shares and savings.",
  },
  {
    href: "/reports-msp-MSP07Report",
    title: "MSP07 Report",
    description: "Provides the regional/district borrower and loan profile, summarizing branches, employees, borrower/loan counts by gender and age (≤35/>35), and outstanding loan amounts as of the selected date.",
  },
  {
    href: "/reports-msp-MSP08Report",
    title: "MSP08 Report",
    description: "Provides the liquidity compliance report, summarizing available liquid assets and short-term liabilities with required minimums, excess/deficiency, and regulatory/PEARLS liquidity ratios as of the selected month.",
  },
  {
    href: "/reports-msp-MSP09MFIReport",
    title: "MSP09 MFI Report",
    description: "This report profiles the loan portfolio by economic sector and gender, showing counts and amounts of loans to female and male borrowers, with sector subtotals.",
  },
  {
    href: "/reports-msp-MSP09Report",
    title: "MSP09 Report",
    description: "This report analyses capital adequacy by breaking down core and institutional capital components, total assets and key capital adequacy ratios.",
  },
  {
    href: "/reports-msp-MSP10MFIReport",
    title: "MSP10 MFI Report",
    description: "This report provides a geographical distribution of branches, staff, compulsory savings and youth/adult loans by gender at district and region level, with country and grand totals.",
  },
  {
    href: "/reports-msp-MSP10Report",
    title: "MSP10 Report",
    description: "This report tracks monthly customer complaints for TCDC institutions, reconciling opening, received, resolved and unresolved complaints and categorising them by complaint type.",
  },
  {
    href: "/reports-msp-MSP11Report",
    title: "MSP11 Report",
    description: "Lists deposits and borrowings by institution category (Banks in Tanzania, Microfinance Service Providers, MNOs, Banks Abroad), computing TZS and FC (TZS equivalent) per institution with category and grand totals.",
  },
];

export default function MspReportsPage() {
  return <ReportCategoryHub title="Msp Reports" reports={reports} />;
}
