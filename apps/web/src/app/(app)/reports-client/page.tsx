import type { Metadata } from "next";

import { ReportCategoryHub } from "@/components/data/report-category-hub";

export const metadata: Metadata = { title: "Client Reports · AIMSCAMS" };

const reports = [
  { href: "/reports-client-ClientListReport", title: "Client List Report" },
  { href: "/reports-client-MemberVerificationReport", title: "Member Verification Report" },
];

export default function ClientReportsPage() {
  return <ReportCategoryHub title="Client Reports" reports={reports} />;
}
