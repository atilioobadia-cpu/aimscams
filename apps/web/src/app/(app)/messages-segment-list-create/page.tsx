import type { Metadata } from "next";

import { MessageSegmentForm } from "@/components/messages/message-segment-form";

export const metadata: Metadata = { title: "Create segment · AIMSCAMS" };

export default function Page() {
  return <MessageSegmentForm />;
}
