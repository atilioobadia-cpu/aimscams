import type { Metadata } from "next";

import { MessageSegmentListPage } from "@/components/messages/message-segment-list-page";

export const metadata: Metadata = { title: "Segments · AIMSCAMS" };

export default function Page() {
  return <MessageSegmentListPage />;
}
