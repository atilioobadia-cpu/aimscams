import type { Metadata } from "next";
import { MessageTemplatesPage } from "@/components/messages/message-templates-page";
export const metadata: Metadata = { title: "Templates · AIMSCAMS" };
export default function Route() { return <MessageTemplatesPage />; }
