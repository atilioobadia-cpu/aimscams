import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "IncomeStatementReport · AIMSCAMS",
};

export default function Page() {
  return (
    <ComingSoon
      title="IncomeStatementReport"
      description="Financial report."
      detail="This report arrives with the financial report engine. It will read posted ledger data only."
    />
  );
}
