import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Transactions · AIMSCAMS",
};

export default function TransactionsPage() {
  return (
    <ComingSoon
      title="Transactions"
      description="Savings deposits, withdrawals, repayments and disbursements."
      detail="The teller and cash-desk journals arrive with the transactions module. Every posting will be written through the API, never from this page."
    />
  );
}
