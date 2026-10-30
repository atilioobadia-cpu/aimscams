import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Expected payment by date report · AIMSCAMS",
};

export default function Page() {
  return (
    <ComingSoon
      title="Expected payment by date report"
      description="Operational and statutory report."
      detail="This report arrives with the reporting module. Reports read posted ledger data only."
    />
  );
}
