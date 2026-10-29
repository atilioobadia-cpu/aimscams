import { apiRequest } from "@/lib/api";

export type MessageLog = {
  id: string;
  channel: string;
  recipient: string;
  body: string;
  status: string;
  provider: string;
  externalRef: string;
  credits: number;
  failureReason: string;
  sentAt: string | null;
  createdAt: string;
};

export type MessageTemplate = {
  id: string;
  key: string;
  name: string;
  channel: string;
  language: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageLogList = { items: MessageLog[]; canView: boolean };
export type MessageTemplateList = { items: MessageTemplate[]; canView: boolean };

export function listMessageLogs(): Promise<MessageLogList> {
  return apiRequest("/messages/logs");
}

export function listMessageTemplates(): Promise<MessageTemplateList> {
  return apiRequest("/messages/templates");
}

export function createMessageTemplate(body: {
  key: string;
  name: string;
  channel?: string;
  language?: string;
  subject?: string;
  body: string;
}) {
  return apiRequest("/messages/templates", { method: "POST", body });
}

export function sendMessage(body: { channel: string; recipient: string; body: string }): Promise<{ id: string; status: string }> {
  return apiRequest<{ id: string; status: string }>("/messages/send", { method: "POST", body });
}
