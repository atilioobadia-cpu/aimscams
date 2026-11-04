import type { Metadata } from "next";

import { ReportCategoryHub } from "@/components/data/report-category-hub";

export const metadata: Metadata = { title: "Client Reports · AIMSCAMS" };

const reports = [
  {
    href: "/reports-client-ClientListReport",
    title: "Client List Report",
    description: "This report lists members with profile, contact, address, branch, status, and policy information.",
  },
  {
    href: "/reports-client-MemberVerificationReport",
    title: "Member Verification Report",
    description: "Member verification status with latest verification history per member.",
  },
];

export default function ClientReportsPage() {
  return <ReportCategoryHub title="Client Reports" reports={reports} />;
}
