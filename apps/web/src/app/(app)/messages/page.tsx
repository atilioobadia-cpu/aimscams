import type { Metadata } from "next";

import { MessageTemplatesPage } from "@/components/messages/message-templates-page";

export const metadata: Metadata = {
  title: "Messages · AIMSCAMS",
};

export default function MessagesPage() {
  return <MessageTemplatesPage />;
}
