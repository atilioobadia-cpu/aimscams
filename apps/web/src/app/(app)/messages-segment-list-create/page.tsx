import type { Metadata } from "next";
import { ComingSoon } from "@/components/shell/coming-soon";
export const metadata: Metadata = { title: "Create segment · AIMSCAMS" };
export default function Page() {
  return (
    <ComingSoon
      title="Create segment"
      description="Create a message segment."
      detail="This module arrives with the messages phase."
    />
  );
}
