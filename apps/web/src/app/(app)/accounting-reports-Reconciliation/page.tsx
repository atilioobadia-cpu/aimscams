import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Reconciliation · AIMSCAMS",
};

export default function Page() {
  return (
    <ComingSoon
      title="Reconciliation"
      description="Financial report."
      detail="This report arrives with the financial report engine. It will read posted ledger data only."
    />
  );
}
