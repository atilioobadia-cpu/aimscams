"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import Link from "next/link";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { listClients, type Client, type ClientStatus, type ClientType } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function ClientsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listClients>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [clientType, setClientType] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listClients({ q: query, status, type: clientType })
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
              setError(message(failure, "Could not load clients."));
            }
          })
          .finally(() => {
            if (cancelled) return;
            firstLoad.current = false;
            setLoading(false);
          });
      },
      firstLoad.current ? 0 : 250,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, status, clientType, reloadKey]);

  const items = data?.items ?? [];
  const hasFilters = Boolean(query.trim() || status || clientType);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Clients" description="Members, borrowers and groups registered at this branch." />
        {data?.canCreate ? (
          <div className="flex gap-2">
            <Button asChild className="h-[var(--control-height)] px-[var(--space-16)] text-fs font-semibold">
              <Link href="/clients/create">Add client</Link>
            </Button>
            <Button asChild variant="outline" className="h-[var(--control-height)] px-[var(--space-16)] text-fs font-semibold">
              <Link href="/clients/create-group">Add group</Link>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-fs font-medium text-body" htmlFor="client-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="client-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Reference, name, phone or national ID"
                className="h-[var(--control-height)] pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-[180px]">
            <label className="mb-1 block text-fs font-medium text-body" htmlFor="client-type">
              Type
            </label>
            <select
              id="client-type"
              value={clientType}
              onChange={(event) => setClientType(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-fs"
            >
              <option value="">All types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="GROUP">Group</option>
            </select>
          </div>
          <div className="w-full md:w-[180px]">
            <label className="mb-1 block text-fs font-medium text-body" htmlFor="client-status">
              Status
            </label>
            <select
              id="client-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-fs"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view clients. Ask an administrator for Client : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No client matches" : "No clients yet"}
          description={hasFilters ? "Adjust or clear the filters to see other clients." : "Add a client to begin."}
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-fs">
              <thead className="border-b border-card-border bg-subtle text-fs font-semibold uppercase tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">National ID</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: Client) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="px-4 py-3 font-medium text-strong">{item.referenceNo}</td>
                    <td className="px-4 py-3 text-body">{item.fullName}</td>
                    <td className="px-4 py-3 text-body">{item.clientType}</td>
                    <td className="px-4 py-3 text-body">{item.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-body">{item.nationalId ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{item.status}</Badge>
                    </td>
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
