"use client";

import { useEffect, useState } from "react";
import { Inbox, Search, SlidersHorizontal } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { MessageServiceShell } from "@/components/messages/message-service-shell";
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
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [dateOrder, setDateOrder] = useState("Newest first");
  const [filtersOpen, setFiltersOpen] = useState(false);
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
        <div className="relative flex min-h-[64px] flex-wrap items-center gap-2 border-b border-card-border p-3">
          <label className="sr-only" htmlFor="message-log-date-filter">Date</label>
          <select id="message-log-date-filter" value={dateOrder} onChange={(event) => setDateOrder(event.target.value)} style={{ width: 72 }} className="h-[34px] rounded-[6px] !border-primary bg-background px-2 fs-text font-medium text-primary">
            <option value="Newest first">Date</option><option value="Oldest first">Oldest first</option>
          </select>
          <div className="relative w-[160px]">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Recipient" aria-label="Filter message logs by recipient" className="h-[34px] !rounded-[6px] !border-primary pl-7" />
          </div>
          <div className="relative">
            <Button type="button" variant="outline" aria-expanded={filtersOpen} aria-haspopup="dialog" onClick={() => setFiltersOpen((open) => !open)} className="h-[34px] gap-2 !rounded-[6px] !border-primary px-3 text-primary hover:bg-primary/5 hover:text-primary">
              <SlidersHorizontal aria-hidden="true" />Add Filters
            </Button>
            {filtersOpen ? (
              <div role="dialog" aria-label="Message log filters" className="absolute left-0 top-full z-20 mt-2 w-[260px] rounded-[6px] border border-card-border bg-card p-3 shadow-lg">
                <label className="mb-1 block fs-text font-medium text-label" htmlFor="message-log-status-filter">Sending Status</label>
                <select id="message-log-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-[34px] w-full rounded-[6px] !border-primary bg-background px-2 fs-text text-body">
                  <option>All statuses</option><option>Queued</option><option>Sent</option><option>Delivered</option><option>Failed</option>
                </select>
                <div className="mt-3 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setStatusFilter("All statuses")} className="h-[30px] px-2 text-primary">Clear</Button>
                  <Button type="button" onClick={() => setFiltersOpen(false)} className="h-[30px] px-3">Apply</Button>
                </div>
              </div>
            ) : null}
          </div>
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
