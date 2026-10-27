import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = {
  title: "Messages · AIMSCAMS",
};

export default function MessagesPage() {
  return (
    <ComingSoon
      title="Messages"
      description="SMS and in-app conversations with clients."
      detail="Templates, delivery status and conversation threads arrive with the messaging module. The chat button in the corner is for support, not client messages."
    />
  );
}
