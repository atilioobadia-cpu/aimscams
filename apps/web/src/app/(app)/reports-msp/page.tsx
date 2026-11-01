import type { Metadata } from "next";

import { ReportCategoryHub } from "@/components/data/report-category-hub";

export const metadata: Metadata = { title: "MSP Reports · AIMSCAMS" };

const reports = [
  { href: "/reports-msp-MSP01Report", title: "MSP 01 Report" },
  { href: "/reports-msp-MSP02Report", title: "MSP 02 Report" },
  { href: "/reports-msp-MSP03MFIReport", title: "MSP 03 MFI Report" },
  { href: "/reports-msp-MSP03Type1Report", title: "MSP 03 Type 1 Report" },
  { href: "/reports-msp-MSP03Type2Report", title: "MSP 03 Type 2 Report" },
  { href: "/reports-msp-MSP04MFIReport", title: "MSP 04 MFI Report" },
  { href: "/reports-msp-MSP04Report", title: "MSP 04 Report" },
  { href: "/reports-msp-MSP05MFIReport", title: "MSP 05 MFI Report" },
  { href: "/reports-msp-MSP05Report", title: "MSP 05 Report" },
  { href: "/reports-msp-MSP06Report", title: "MSP 06 Report" },
  { href: "/reports-msp-MSP07Report", title: "MSP 07 Report" },
  { href: "/reports-msp-MSP08Report", title: "MSP 08 Report" },
  { href: "/reports-msp-MSP09MFIReport", title: "MSP 09 MFI Report" },
  { href: "/reports-msp-MSP09Report", title: "MSP 09 Report" },
  { href: "/reports-msp-MSP10MFIReport", title: "MSP 10 MFI Report" },
  { href: "/reports-msp-MSP10Report", title: "MSP 10 Report" },
  { href: "/reports-msp-MSP11Report", title: "MSP 11 Report" },
];

export default function MspReportsPage() {
  return <ReportCategoryHub title="MSP Reports" reports={reports} />;
}
