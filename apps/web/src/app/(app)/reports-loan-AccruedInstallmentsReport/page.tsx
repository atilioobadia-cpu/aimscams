import type { Metadata } from "next";

import { AccruedInstallmentsReportPage } from "@/components/accounting/loan-operational-report-page";

export const metadata: Metadata = { title: "Accrued installments report · AIMSCAMS" };

export default function Route() {
  return <AccruedInstallmentsReportPage />;
}
