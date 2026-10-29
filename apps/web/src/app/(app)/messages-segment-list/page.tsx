import type { Metadata } from "next";
import { ComingSoon } from "@/components/shell/coming-soon";
export const metadata: Metadata = { title: "Segments · AIMSCAMS" };
export default function Page() {
  return (
    <ComingSoon
      title="Segments"
      description="Message segments."
      detail="This module arrives with the messages phase."
    />
  );
}
