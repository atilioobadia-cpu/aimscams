import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Business account · AIMSCAMS",
};

export default function BusinessAccountPage() {
  return (
    <ComingSoon
      title="Business account"
      description="The institution's own bank and cash accounts."
      detail="Bank reconciliation and treasury transfers arrive with the business-account module. Client funds and institution funds are never mixed."
    />
  );
}
