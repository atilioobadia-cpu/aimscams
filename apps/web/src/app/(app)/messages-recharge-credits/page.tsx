import type { Metadata } from "next";

import { RechargeCreditsForm } from "@/components/messages/recharge-credits-form";

export const metadata: Metadata = { title: "Recharge credits · AIMSCAMS" };

export default function RechargeCreditsPage() {
  return <RechargeCreditsForm />;
}
