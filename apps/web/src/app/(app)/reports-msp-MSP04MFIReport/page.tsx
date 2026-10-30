import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "MSP04 mfireport · AIMSCAMS",
};

export default function Page() {
  return (
    <ComingSoon
      title="MSP04 mfireport"
      description="Operational and statutory report."
      detail="This report arrives with the reporting module. Reports read posted ledger data only."
    />
  );
}
