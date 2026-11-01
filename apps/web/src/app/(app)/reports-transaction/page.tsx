import type { Metadata } from "next";

import { ReportCategoryHub } from "@/components/data/report-category-hub";

export const metadata: Metadata = { title: "Transaction Reports · AIMSCAMS" };

const reports = [
  { href: "/reports-transaction-DailyTransactionReport", title: "Daily Transaction Report" },
  { href: "/reports-transaction-ExpenseReport", title: "Expense Report" },
  { href: "/reports-transaction-FeesIncomeReport", title: "Fees Income Report" },
  { href: "/reports-transaction-ReversedTransactionReport", title: "Reversed Transaction Report" },
];

export default function TransactionReportsPage() {
  return <ReportCategoryHub title="Transaction Reports" reports={reports} />;
}
