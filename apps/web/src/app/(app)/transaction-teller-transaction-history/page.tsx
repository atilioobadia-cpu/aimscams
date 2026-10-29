import type { Metadata } from "next";

import { TellerHistoryPage } from "@/components/transactions/teller-history-page";

export const metadata: Metadata = {
  title: "Teller history · AIMSCAMS",
};

export default function TellerHistoryRoute() {
  return <TellerHistoryPage />;
}
