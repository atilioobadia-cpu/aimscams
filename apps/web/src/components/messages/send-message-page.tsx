"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";

import { ErrorPanel, ForbiddenPanel } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { listMessageTemplates, sendMessage, type MessageTemplate } from "@/lib/messages";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not send the message.";
}

export function SendMessagePage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [channel, setChannel] = useState("SMS");
  const [recipient, setRecipient] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void listMessageTemplates()
      .then((response) => {
        if (!active) return;
        setTemplates(response.items);
      })
      .catch(() => {
        /* templates are optional; keep the composer usable */
      });
    return () => {
      active = false;
    };
  }, []);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const template = templates.find((item) => item.id === id);
    if (template) {
      setChannel(template.channel || channel);
      setBody(template.body);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await sendMessage({ channel, recipient, body });
      setResult(`Message sent (${res.status}).`);
      setRecipient("");
      setBody("");
      setTemplateId("");
    } catch (failure) {
      setError(failureMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Send message" description="Compose and send a transactional message." breadcrumb="Messages" />

      {error ? <ErrorPanel message={error} /> : null}
      {result ? <p className="fs-text text-accent-teal" role="status">{result}</p> : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="template">Template</label>
              <select id="template" value={templateId} onChange={(event) => applyTemplate(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
                <option value="">No template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="channel">Channel</label>
              <select id="channel" value={channel} onChange={(event) => setChannel(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="recipient">Recipient</label>
              <Input id="recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Phone or email" className="h-[var(--control-height)]" required />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="body">Message body</label>
              <textarea id="body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message text" rows={4} className="w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] py-[var(--space-8)] fs-text" required />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={submitting || !recipient || !body}>
              <Send className="size-4" aria-hidden="true" />
              {submitting ? "Sending..." : "Send message"}
            </Button>
            <Button type="button" variant="outline" disabled>
              Test message
            </Button>
            <Button asChild variant="outline">
              <a href="/messages">Cancel</a>
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
