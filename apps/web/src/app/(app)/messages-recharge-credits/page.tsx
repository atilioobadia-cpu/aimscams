import type { Metadata } from "next";
import { ComingSoon } from "@/components/shell/coming-soon";
export const metadata: Metadata = { title: "Recharge credits · AIMSCAMS" };
export default function Page() {
  return (
    <ComingSoon
      title="Recharge credits"
      description="Recharge message credits."
      detail="This module arrives with the messages phase."
    />
  );
}
