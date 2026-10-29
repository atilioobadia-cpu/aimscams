import type { Metadata } from "next";
import { ComingSoon } from "@/components/shell/coming-soon";
export const metadata: Metadata = { title: "Service providers · AIMSCAMS" };
export default function Page() {
  return (
    <ComingSoon
      title="Service providers"
      description="SMS and email service providers."
      detail="This module arrives with the messages phase."
    />
  );
}
