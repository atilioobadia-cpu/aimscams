import type { Metadata } from "next";
import { ComingSoon } from "@/components/shell/coming-soon";
export const metadata: Metadata = { title: "Message users · AIMSCAMS" };
export default function Page() {
  return (
    <ComingSoon
      title="Message users"
      description="Message users."
      detail="This module arrives with the messages phase."
    />
  );
}
