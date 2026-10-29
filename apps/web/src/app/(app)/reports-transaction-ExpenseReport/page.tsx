import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "transaction ExpenseReport · AIMSCAMS",
};

export default function Page() {
  return (
    <ComingSoon
      title="transaction ExpenseReport"
      description="Operational and statutory report."
      detail="This report arrives with the reporting module. Reports read posted ledger data only."
    />
  );
}
