import type { Metadata } from "next";

import { TellerConsolePage } from "@/components/transactions/teller-console-page";

export const metadata: Metadata = {
  title: "Teller console · AIMSCAMS",
};

export default function TellerConsoleRoute() {
  return <TellerConsolePage />;
}
