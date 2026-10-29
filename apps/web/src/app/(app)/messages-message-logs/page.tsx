import type { Metadata } from "next";
import { MessageLogsPage } from "@/components/messages/message-logs-page";
export const metadata: Metadata = { title: "Delivery logs · AIMSCAMS" };
export default function Route() { return <MessageLogsPage />; }
