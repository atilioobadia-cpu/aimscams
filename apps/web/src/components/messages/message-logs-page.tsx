"use client";

import { useEffect, useState } from "react";
import { Mail, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { titleCase } from "@/lib/privacy";
import { listMessageLogs, type MessageLog, type MessageLogList } from "@/lib/messages";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load delivery logs.";
}

export function MessageLogsPage() {
  const [data, setData] = useState<MessageLogList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listMessageLogs()
        .then((next) => {
          if (cancelled) return;
          setData(next);
          setForbidden(false);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) {
            setForbidden(true);
            setData(null);
          } else {
            setError(failureMessage(failure));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reloadKey]);

  const items = (data?.items ?? []).filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return item.recipient.toLowerCase().includes(q) || item.channel.toLowerCase().includes(q) || item.status.toLowerCase().includes(q);
  });

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Delivery logs" description="Message delivery status and credits." />
        <ForbiddenPanel message="Your role cannot view message logs. Ask an administrator for Message : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Delivery logs" description="Message delivery status and credits." breadcrumb="Messages" />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Recipient, channel or status" className="h-[var(--control-height)] pl-9" />
        </div>
      </section>

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={6} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState icon={Mail} title="No messages yet" description="Sent messages will appear here." />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Channel</th>
                  <th className="whitespace-nowrap px-4 py-3">Recipient</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                  <th className="whitespace-nowrap px-4 py-3">Provider</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Credits</th>
                  <th className="whitespace-nowrap px-4 py-3">Sent at</th>
                  <th className="whitespace-nowrap px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: MessageLog) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.channel}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.recipient}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={item.status === "SENT" || item.status === "DELIVERED" ? "default" : item.status === "FAILED" ? "destructive" : "outline"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.provider}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{item.credits}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.sentAt ? new Date(item.sentAt).toLocaleString() : "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
