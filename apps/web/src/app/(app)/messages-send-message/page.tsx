import type { Metadata } from "next";
import { SendMessagePage } from "@/components/messages/send-message-page";
export const metadata: Metadata = { title: "Send message · AIMSCAMS" };
export default function Route() { return <SendMessagePage />; }
