import type { Metadata } from "next";
import { MessageUsersPage } from "@/components/messages/message-users-page";
export const metadata: Metadata = { title: "Message users · AIMSCAMS" };
export default function Page() {
  return (
    <MessageUsersPage />
  );
}
