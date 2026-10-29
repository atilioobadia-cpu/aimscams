import type { Metadata } from "next";

import { AllTransactionsPage } from "@/components/transactions/all-transactions-page";

export const metadata: Metadata = {
  title: "All transactions · AIMSCAMS",
};

export default function AllTransactionsRoute() {
  return <AllTransactionsPage />;
}
