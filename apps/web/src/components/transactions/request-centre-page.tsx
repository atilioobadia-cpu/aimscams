"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Funnel, Inbox, Mail, Plus, Search, X } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { listRequests, type RequestList, type RequestStatus } from "@/lib/transactions";
import { RequestQueueTable } from "@/components/transactions/request-queue-table";

type RequestTab = "assigned" | "active" | "all";

const REQUEST_TABS: { id: RequestTab; label: string }[] = [
  { id: "assigned", label: "Assigned Requests" },
  { id: "active", label: "Active Requests" },
  { id: "all", label: "All Requests" },
];

const REQUEST_STATUSES: { value: RequestStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load requests.";
}

export function RequestCentrePage() {
  const [data, setData] = useState<RequestList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<RequestTab>("all");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");
  const [requestType, setRequestType] = useState("");
  const [requestTypeDraft, setRequestTypeDraft] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [requestTypeFilterOpen, setRequestTypeFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listRequests({
        q: query,
        status: statusFilter || (tab === "active" ? "PENDING" : undefined),
        assignedToMe: tab === "assigned" ? true : undefined,
        requestType: requestType || undefined,
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
  }, [query, tab, statusFilter, requestType, page, reloadKey]);

  const items = data?.items ?? [];
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)));
  const selectedStatusLabel = REQUEST_STATUSES.find((item) => item.value === statusFilter)?.label;

  function chooseTab(nextTab: RequestTab) {
    setTab(nextTab);
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("");
    setRequestType("");
    setRequestTypeDraft("");
    setPage(1);
    setStatusOpen(false);
    setFiltersOpen(false);
    setRequestTypeFilterOpen(false);
  }

  let tableState: React.ReactNode = null;
  if (forbidden) {
    tableState = <ForbiddenPanel message="Your role cannot view requests. Ask an administrator for Transaction : View." />;
  } else if (error) {
    tableState = <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />;
  } else if (loading) {
    tableState = <PanelSkeleton rows={4} />;
  } else if (items.length === 0) {
    tableState = (
      <div className="flex min-h-[212px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Inbox className="size-11 stroke-[1.8]" aria-hidden="true" />
        <span className="fs-text">No data available</span>
      </div>
    );
  }

  return (
    <div className="space-y-[18px]">
      <section className="grid min-h-[94px] grid-cols-2 items-center gap-x-6 gap-y-3 rounded-[var(--card-radius)] border border-card-border bg-surface px-6 py-4 sm:grid-cols-3 lg:grid-cols-[minmax(170px,1.15fr)_repeat(5,minmax(125px,1fr))]">
        <div className="flex items-center gap-3">
          <Mail className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <h1 className="fs-title font-semibold text-heading">Requests</h1>
        </div>
        {[
          ["Total Requests", data?.counts.total ?? 0],
          ["Pending Requests", data?.counts.pending ?? 0],
          ["Approved Requests", data?.counts.approved ?? 0],
          ["Rejected Requests", data?.counts.rejected ?? 0],
          ["Cancelled Requests", data?.counts.cancelled ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <div className="fs-text font-semibold text-heading">{label}</div>
            <div className="mt-0.5 fs-text tabular-nums text-strong">{value}</div>
          </div>
        ))}
      </section>

      <section className="overflow-visible rounded-[var(--card-radius)] border border-card-border bg-surface">
        <div role="tablist" aria-label="Request queue" className="flex min-h-[55px] items-stretch overflow-x-auto border-b border-card-border bg-subtle">
          {REQUEST_TABS.map((item) => (
            <button
              key={item.id}
              id={"request-tab-" + item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls="request-table-panel"
              onClick={() => chooseTab(item.id)}
              className={tab === item.id
                ? "min-h-[55px] whitespace-nowrap border-b-2 border-primary px-5 fs-text font-semibold text-primary"
                : "min-h-[55px] whitespace-nowrap border-b-2 border-transparent px-5 fs-text text-label hover:bg-surface hover:text-primary"}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div id="request-table-panel" role="tabpanel" aria-labelledby={"request-tab-" + tab}>
          <div className="flex min-h-[72px] flex-wrap items-center gap-2.5 border-b border-card-border px-[18px] py-[14px]">
            <div className="relative w-[240px] max-w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
              <Input
                aria-label="Search requests"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder="Search"
                className="h-[44px] rounded-[6px] border-primary pl-9 fs-text"
              />
            </div>

            <div className="relative">
              <div className="flex h-[44px] min-w-[185px] items-center rounded-[6px] border border-primary bg-surface text-primary">
                <button
                  type="button"
                  aria-expanded={statusOpen}
                  onClick={() => { setStatusOpen((open) => !open); setFiltersOpen(false); }}
                  className="flex h-full flex-1 items-center justify-between gap-3 px-3 fs-text"
                >
                  <span>{selectedStatusLabel ?? "Request Status"}</span>
                  <ChevronDown className={statusOpen ? "size-4 rotate-180 transition-transform" : "size-4 transition-transform"} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Clear request status filter"
                  onClick={() => { setStatusFilter(""); setPage(1); }}
                  className="grid size-9 place-items-center border-l border-primary/30 hover:bg-primary-tint"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              {statusOpen ? (
                <div role="menu" aria-label="Request status" className="absolute left-0 top-[48px] z-30 min-w-full rounded-[6px] border border-card-border bg-surface p-1 shadow-lg">
                  {REQUEST_STATUSES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={statusFilter === item.value}
                      onClick={() => { setStatusFilter(item.value); setPage(1); setStatusOpen(false); }}
                      className={statusFilter === item.value
                        ? "block w-full rounded px-3 py-2 text-left fs-text font-semibold text-primary hover:bg-primary-tint"
                        : "block w-full rounded px-3 py-2 text-left fs-text text-body hover:bg-primary-tint"}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setStatusFilter(""); setPage(1); setStatusOpen(false); }}
                    className="block w-full rounded px-3 py-2 text-left fs-text text-muted-foreground hover:bg-subtle"
                  >
                    Clear status
                  </button>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                aria-expanded={filtersOpen}
                onClick={() => { setFiltersOpen((open) => !open); setStatusOpen(false); }}
                className="h-[44px] min-w-[168px] justify-between rounded-[6px] border-primary px-3 text-primary"
              >
                <span className="inline-flex items-center gap-2"><Plus className="size-4" aria-hidden="true" />Add Filters</span>
                <ChevronDown className={filtersOpen ? "size-4 rotate-180 transition-transform" : "size-4 transition-transform"} aria-hidden="true" />
              </Button>
              {filtersOpen ? (
                <div role="menu" aria-label="Available request filters" className="absolute left-0 top-[48px] z-30 min-w-[190px] rounded-[6px] border border-card-border bg-surface p-1 shadow-lg">
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={requestTypeFilterOpen}
                    onClick={() => { setRequestTypeFilterOpen(true); setFiltersOpen(false); }}
                    className="block w-full rounded px-3 py-2 text-left fs-text text-body hover:bg-primary-tint"
                  >
                    Request Type
                  </button>
                </div>
              ) : null}
            </div>

            <Button
              type="button"
              variant="outline"
              aria-label="Apply request filters"
              title="Apply filters"
              onClick={() => { setPage(1); setReloadKey((value) => value + 1); setFiltersOpen(false); setStatusOpen(false); }}
              className="size-[40px] rounded-[6px] border-primary p-0 text-primary"
            >
              <Funnel className="size-4" aria-hidden="true" />
            </Button>

            {requestTypeFilterOpen ? (
              <div className="flex h-[44px] items-center gap-2 rounded-[6px] border border-primary px-3">
                <label htmlFor="request-type-filter" className="sr-only">Request type</label>
                <input
                  id="request-type-filter"
                  value={requestTypeDraft}
                  onChange={(event) => { setRequestTypeDraft(event.target.value); setRequestType(event.target.value); setPage(1); }}
                  placeholder="Request type"
                  className="w-[150px] bg-transparent fs-text text-body outline-none"
                />
                <button
                  type="button"
                  aria-label="Remove request type filter"
                  onClick={() => { setRequestType(""); setRequestTypeDraft(""); setRequestTypeFilterOpen(false); setPage(1); }}
                  className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-subtle"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}

            {query || statusFilter || requestType ? (
              <button type="button" onClick={clearFilters} className="px-2 fs-text text-primary underline underline-offset-2 hover:text-primary/80">
                Clear all
              </button>
            ) : null}
          </div>

          <RequestQueueTable
            items={items}
            total={data?.total ?? 0}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            stateContent={tableState}
          />
        </div>
      </section>
    </div>
  );
}
