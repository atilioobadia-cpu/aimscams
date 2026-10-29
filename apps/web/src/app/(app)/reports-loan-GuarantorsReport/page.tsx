import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "loan GuarantorsReport · AIMSCAMS",
};

export default function Page() {
  return (
    <ComingSoon
      title="loan GuarantorsReport"
      description="Operational and statutory report."
      detail="This report arrives with the reporting module. Reports read posted ledger data only."
    />
  );
}
