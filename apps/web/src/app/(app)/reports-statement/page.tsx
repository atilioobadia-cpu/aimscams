import type { Metadata } from "next";

import { ReportCategoryHub } from "@/components/data/report-category-hub";

export const metadata: Metadata = {
  title: "Statement Reports · AIMSCAMS",
};

const reports = [
  {
    href: "/reports-statement-AccountStatementReport",
    title: "Account Statement Report",
    description: "This report generates an account statement for a given account number between two dates.",
  },
  {
    href: "/reports-statement-MemberStatementReport",
    title: "Member Statement Report",
    description: "Member statement for a selected period; shows transactions across the member's account.",
  },
];

export default function StatementHubPage() {
  return <ReportCategoryHub title="Statement Reports" reports={reports} />;
}
