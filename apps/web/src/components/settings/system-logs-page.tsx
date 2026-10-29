"use client";

import { useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { titleCase } from "@/lib/privacy";
import { listSystemLogs, type SystemLogEntry, type SystemLogList } from "@/lib/settings";

const TABS = ["Activity", "Security", "Accounting", "Integrations", "Errors", "Data changes"];

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load system logs.";
}

export function SystemLogsPage() {
  const [data, setData] = useState<SystemLogList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [tab, setTab] = useState("Activity");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [actor, setActor] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [correlationId, setCorrelationId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listSystemLogs({ tab, from: from || undefined, to: to || undefined, actor: actor || undefined, module: moduleFilter || undefined, correlationId: correlationId || undefined })
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
  }, [tab, from, to, actor, moduleFilter, correlationId, reloadKey]);

  const items = data?.items ?? [];

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="System logs" description="Audit trail and diagnostics." />
        <ForbiddenPanel message="Your role cannot view system logs. Ask an administrator for System Log : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="System logs" description="One place to answer who did this and what is broken." breadcrumb="Settings" />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section className="overflow-x-auto rounded-[var(--card-radius)] border border-card-border bg-surface p-2">
        <div role="tablist" aria-label="Log category" className="flex min-w-max gap-1">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
              className={`rounded-[var(--pill-radius)] px-3 py-2 fs-text font-medium ${tab === item ? "bg-primary text-white" : "text-strong hover:bg-subtle"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="log-from">From</label>
            <Input id="log-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="log-to">To</label>
            <Input id="log-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="log-actor">Actor</label>
            <Input id="log-actor" value={actor} onChange={(event) => setActor(event.target.value)} placeholder="Name" className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="log-module">Module</label>
            <Input id="log-module" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} placeholder="Entity type" className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="log-correlation">Correlation ID</label>
            <Input id="log-correlation" value={correlationId} onChange={(event) => setCorrelationId(event.target.value)} placeholder="ID" className="h-[var(--control-height)]" />
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title="No log entries" description="Audited actions will appear here." />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Time</th>
                  <th className="whitespace-nowrap px-4 py-3">Actor</th>
                  <th className="whitespace-nowrap px-4 py-3">Action</th>
                  <th className="whitespace-nowrap px-4 py-3">Entity</th>
                  <th className="whitespace-nowrap px-4 py-3">Entity ID</th>
                  <th className="whitespace-nowrap px-4 py-3">IP</th>
                  <th className="whitespace-nowrap px-4 py-3">Correlation</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: SystemLogEntry) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.actor}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.action}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.entityType}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.entityId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.ipAddress}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.correlationId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-4 py-3 fs-text text-muted-foreground">
            <span>{items.length} entries</span>
          </div>
        </section>
      )}
    </div>
  );
}
