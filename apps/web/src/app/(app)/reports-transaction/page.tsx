import type { Metadata } from "next";

import { ReportCategoryHub } from "@/components/data/report-category-hub";

export const metadata: Metadata = { title: "Transaction Reports · AIMSCAMS" };

const reports = [
  {
    href: "/reports-transaction-DailyTransactionReport",
    title: "Daily Transaction Report",
    description: "This report lists the transactions between the selected date range for Loan, Saving & Shares accounts of all members.",
  },
  {
    href: "/reports-transaction-ExpenseReport",
    title: "Expense Report",
    description: "This V2 report tracks the expense transactions.",
  },
  {
    href: "/reports-transaction-FeesIncomeReport",
    title: "Fees Income Report",
    description: "This V2 report summarizes the income generated through fees.",
  },
  {
    href: "/reports-transaction-ReversedTransactionReport",
    title: "Reversed Transaction Report",
    description: "This V2 report lists all reversed transactions.",
  },
];

export default function TransactionReportsPage() {
  return <ReportCategoryHub title="Transaction Reports" reports={reports} />;
}
