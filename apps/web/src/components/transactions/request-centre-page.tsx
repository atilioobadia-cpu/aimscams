"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RequestQueueTable } from "@/components/transactions/request-queue-table";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { listRequests, type RequestList, type RequestStatus } from "@/lib/transactions";

type RequestTab =
  "total" | "active" | "pending" | "all" | "approved" | "rejected" | "cancelled" | "assigned";

const REQUEST_TABS: { id: RequestTab; label: string }[] = [
  { id: "total", label: "Total" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "all", label: "All" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "cancelled", label: "Cancelled" },
  { id: "assigned", label: "Assigned requests" },
];

function requestStatus(tab: RequestTab): RequestStatus | undefined {
  if (tab === "approved") return "APPROVED";
  if (tab === "rejected") return "REJECTED";
  if (tab === "cancelled") return "CANCELLED";
  if (tab === "active" || tab === "pending") return "PENDING";
  return undefined;
}

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load requests.";
}

function requestCount(data: RequestList | null, tab: RequestTab): number {
  if (!data) return 0;
  if (tab === "total" || tab === "all") return data.counts.total;
  if (tab === "active") return data.counts.active;
  if (tab === "pending") return data.counts.pending;
  if (tab === "assigned") return data.counts.assigned;
  return data.counts[tab];
}

export function RequestCentrePage() {
  const [data, setData] = useState<RequestList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<RequestTab>("total");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listRequests({
        q: query,
        status: requestStatus(tab),
        assignedToMe: tab === "assigned" ? true : undefined,
        page,
      })
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
  }, [query, tab, page, reloadKey]);

  const items = data?.items ?? [];
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Request centre"
        description="Review requests that need a second pair of eyes."
        breadcrumb="Requests"
      />

      <section className="overflow-x-auto rounded-[var(--card-radius)] border border-card-border bg-surface p-2">
        <div role="group" aria-label="Request status" className="flex min-w-max gap-1">
          {REQUEST_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={tab === item.id}
              onClick={() => {
                setTab(item.id);
                setPage(1);
              }}
              className={`rounded-[var(--pill-radius)] px-3 py-2 fs-text font-medium ${
                tab === item.id ? "bg-primary text-white" : "text-strong hover:bg-subtle"
              }`}
            >
              {item.label} <span className="ml-1 tabular-nums">{requestCount(data, item.id)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <label className="mb-1 block fs-text font-medium text-body" htmlFor="request-search">
          Search requests
        </label>
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="request-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Request number, type or reason"
            className="h-[var(--control-height)] pl-9"
          />
        </div>
      </section>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view requests. Ask an administrator for Transaction : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={7} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={query.trim() || tab !== "total" ? "No requests match" : "No requests yet"}
          description={
            query.trim() || tab !== "total"
              ? "Adjust the filters to see other requests."
              : "Requests submitted for approval will appear here."
          }
        />
      ) : (
        <RequestQueueTable
          items={items}
          total={data?.total ?? 0}
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
