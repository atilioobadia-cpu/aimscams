import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Requests · AIMSCAMS",
};

export default function RequestsPage() {
  return (
    <ComingSoon
      title="Requests"
      description="Client requests that need a staff decision."
      detail="Loan requests, limit changes and document requests arrive with the requests module. Approvals will be recorded with the officer, the timestamp and the reason."
    />
  );
}
