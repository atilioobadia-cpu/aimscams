import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "loan IssuedLoansAndArrearsReport · AIMSCAMS",
};

export default function Page() {
  return (
    <ComingSoon
      title="loan IssuedLoansAndArrearsReport"
      description="Operational and statutory report."
      detail="This report arrives with the reporting module. Reports read posted ledger data only."
    />
  );
}
