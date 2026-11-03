"use client";

import { useEffect, useState } from "react";
import { Inbox, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { MessageServiceShell } from "@/components/messages/message-service-shell";
import { Badge } from "@/components/ui/badge";
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
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [dateOrder, setDateOrder] = useState("Newest first");
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
    const matchesQuery = !q || item.recipient.toLowerCase().includes(q) || item.channel.toLowerCase().includes(q) || item.status.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All statuses" || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesQuery && matchesStatus;
  }).sort((a, b) => {
    const delta = new Date(a.sentAt ?? a.createdAt).getTime() - new Date(b.sentAt ?? b.createdAt).getTime();
    return dateOrder === "Oldest first" ? delta : -delta;
  });

  if (forbidden) {
    return <MessageServiceShell activeTab="Logs"><ForbiddenPanel message="Your role cannot view message logs. Ask an administrator for Message : View." /></MessageServiceShell>;
  }

  return (
    <MessageServiceShell activeTab="Logs">
      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section aria-label="Delivery logs" className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="flex min-h-[72px] flex-wrap items-center gap-2 border-b border-card-border p-3">
          <label className="sr-only" htmlFor="message-log-date-filter">Date</label>
          <select id="message-log-date-filter" value={dateOrder} onChange={(event) => setDateOrder(event.target.value)} className="h-[42px] rounded-[var(--control-radius)] border border-primary bg-background px-3 fs-text font-medium text-primary">
            <option>Newest first</option><option>Oldest first</option>
          </select>
          <div className="relative w-full max-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Recipient" aria-label="Filter message logs by recipient" className="h-[42px] pl-9" />
          </div>
          <label className="sr-only" htmlFor="message-log-status-filter">Status filter</label>
          <select id="message-log-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-[42px] rounded-[var(--control-radius)] border border-primary bg-background px-3 fs-text font-medium text-primary">
            <option>All statuses</option><option>Queued</option><option>Sent</option><option>Delivered</option><option>Failed</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Delivery</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Date</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Type</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Recipient</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Sending Status</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Message Type</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Template</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Credits</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3">Company</th>
                  <th scope="col" className="px-3 py-3"><span className="sr-only">Table columns</span></th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={10} className="px-4 py-3"><PanelSkeleton rows={5} /></td></tr> : items.length === 0 ? (
                  <tr><td colSpan={10} className="h-[212px] px-4 text-center text-muted-foreground"><div className="flex flex-col items-center gap-4"><Inbox className="size-12" aria-hidden="true" /><span>No data available</span></div></td></tr>
                ) : items.map((item: MessageLog) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={item.status === "SENT" || item.status === "DELIVERED" ? "default" : item.status === "FAILED" ? "destructive" : "outline"}>{titleCase(item.status)}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.sentAt ? new Date(item.sentAt).toLocaleString() : new Date(item.createdAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.channel}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.recipient}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(item.status)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">—</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">—</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{item.credits}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">—</td>
                    <td className="px-3 py-3 text-body">—</td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      </section>
    </MessageServiceShell>
  );
}
