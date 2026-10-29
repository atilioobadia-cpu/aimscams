"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { titleCase } from "@/lib/privacy";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { listJournalEntries, type JournalEntrySummary } from "@/lib/accounting";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load journal entries.";
}

export function JournalBookPage({ title, description }: { title: string; description: string }) {
  const [entries, setEntries] = useState<JournalEntrySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listJournalEntries({ from: from || undefined, to: to || undefined, q: q || undefined, limit: 200, offset: 0 })
        .then((next) => {
          if (cancelled) return;
          setEntries(next.entries);
          setTotal(next.total);
          setForbidden(false);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) {
            setForbidden(true);
            setEntries([]);
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
  }, [from, to, q, reloadKey]);

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title={title} description={description} />
        <ForbiddenPanel message="Your role cannot view journal entries. Ask an administrator for Settings Accounting : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} breadcrumb="Accounting" />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="from">From</label>
            <Input id="from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="to">To</label>
            <Input id="to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="q">Search</label>
            <Input id="q" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Entry number or description" className="h-[var(--control-height)]" />
          </div>
          <Button type="button" variant="outline" onClick={() => setReloadKey((value) => value + 1)}>Refresh</Button>
        </div>
      </section>

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : entries.length === 0 ? (
        <EmptyState icon={BookOpen} title="No journal entries" description="Posted and draft entries will appear here." />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Entry no.</th>
                  <th className="whitespace-nowrap px-4 py-3">Date</th>
                  <th className="whitespace-nowrap px-4 py-3">Event</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Debit</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{entry.entryNo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{entry.entryDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{entry.eventCode}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={entry.status === "posted" ? "default" : "outline"}>{titleCase(entry.status)}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(entry.debitMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{formatTzs(entry.creditMinor)}</td>
                    <td className="px-4 py-3 text-body">{entry.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-4 py-3 fs-text text-muted-foreground">
            <span>{total} entries</span>
          </div>
        </section>
      )}
    </div>
  );
}
