import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Reports · AIMSCAMS",
};

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports"
      description="Operational, portfolio and regulatory returns."
      detail="The report catalogue, including the MSP01–MSP11 returns, arrives with the reporting module. Reports will read the posted ledger only."
    />
  );
}
