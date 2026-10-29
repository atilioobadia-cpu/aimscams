import type { Metadata } from "next";

import { TellerApprovalRequestPage } from "@/components/transactions/teller-approval-request-page";

export const metadata: Metadata = {
  title: "Teller approval request · AIMSCAMS",
};

export default function TellerApprovalRequestRoute() {
  return <TellerApprovalRequestPage />;
}
