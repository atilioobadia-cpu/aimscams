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
type RequestStatusCondition = "IS" | "IS_ANY_OF" | "IS_NOT" | "IS_NONE_OF";

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

const REQUEST_STATUS_CONDITIONS: { value: RequestStatusCondition; label: string }[] = [
  { value: "IS", label: "Is" },
  { value: "IS_ANY_OF", label: "Is any of" },
  { value: "IS_NOT", label: "Is not" },
  { value: "IS_NONE_OF", label: "Is none of" },
];

const REQUEST_FILTER_OPTIONS = [
  { id: "RequestByUserId", label: "Request by User" },
  { id: "RequestType", label: "Request Type" },
  { id: "Amount", label: "Amount" },
  { id: "Requests_CurrentAssignee", label: "Current Assignee" },
  { id: "Requests_ApprovedBy", label: "Approved by" },
  { id: "ApprovalDate", label: "Approval Date" },
  { id: "CreatedDate", label: "Created Date" },
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
  const [statusCondition, setStatusCondition] = useState<RequestStatusCondition>("IS");
  const [statusDraft, setStatusDraft] = useState<RequestStatus | "">("");
  const [statusConditionDraft, setStatusConditionDraft] = useState<RequestStatusCondition>("IS");
  const [requestType, setRequestType] = useState("");
  const [requestTypeDraft, setRequestTypeDraft] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [selectedFilterFields, setSelectedFilterFields] = useState<string[]>([]);
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
        statusCondition: statusFilter ? statusCondition : undefined,
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
  function chooseTab(nextTab: RequestTab) {
    setTab(nextTab);
    setPage(1);
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
      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Inbox className="size-11 stroke-[1.8]" aria-hidden="true" />
        <span className="fs-text">No data available</span>
      </div>
    );
  }

  return (
    <div className="requests-page">
      <section className="requests-summary rounded-[var(--card-radius)] border border-card-border bg-surface">
        <div className="requests-summary-title flex items-center">
          <Mail className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <h1 className="fs-title font-semibold text-heading">Requests</h1>
        </div>
        <div className="requests-summary-stats">
          {[
          ["Total Requests", data?.counts.total ?? 0],
          ["Pending Requests", data?.counts.pending ?? 0],
          ["Approved Requests", data?.counts.approved ?? 0],
          ["Rejected Requests", data?.counts.rejected ?? 0],
          ["Cancelled Requests", data?.counts.cancelled ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="requests-summary-stat">
              <div className="requests-summary-label">{label}</div>
              <div className="requests-summary-value">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="requests-queue rounded-[var(--card-radius)] border border-card-border bg-surface">
        <div role="tablist" aria-label="Request queue" className="requests-tabs">
          {REQUEST_TABS.map((item) => (
            <button
              key={item.id}
              id={"request-tab-" + item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls="request-table-panel"
              onClick={() => chooseTab(item.id)}
              className={tab === item.id ? "requests-tab requests-tab-active" : "requests-tab"}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div id="request-table-panel" role="tabpanel" aria-labelledby={"request-tab-" + tab}>
          <div className="requests-toolbar">
            <div className="requests-search">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
              <Input
                aria-label="Search requests"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder="Search"
                className="requests-search-input"
              />
            </div>

            <div className="relative">
              <div className="requests-status-filter">
                <button
                  type="button"
                  aria-expanded={statusOpen}
                  onClick={() => {
                    setStatusOpen((open) => !open);
                    setStatusDraft(statusFilter);
                    setStatusConditionDraft(statusCondition);
                    setFiltersOpen(false);
                  }}
                  className="requests-status-trigger"
                >
                  <span>Request Status</span>
                  <ChevronDown className={statusOpen ? "size-4 rotate-180 transition-transform" : "size-4 transition-transform"} aria-hidden="true" />
                </button>
                {statusFilter ? <button
                  type="button"
                  aria-label="Clear request status filter"
                  onClick={() => { setStatusFilter(""); setPage(1); }}
                  className="requests-status-clear"
                >
                  <X className="size-4" aria-hidden="true" />
                </button> : null}
              </div>
              {statusOpen ? (
                <div role="dialog" aria-label="Request Status filter" className="requests-status-popover">
                  <h2>Request Status</h2>
                  <div className="requests-status-rule">
                    <label htmlFor="request-status-condition">Condition</label>
                    <select
                      id="request-status-condition"
                      value={statusConditionDraft}
                      onChange={(event) => setStatusConditionDraft(event.target.value as RequestStatusCondition)}
                    >
                      {REQUEST_STATUS_CONDITIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    <label htmlFor="request-status-value">Value</label>
                    <select
                      id="request-status-value"
                      value={statusDraft}
                      onChange={(event) => setStatusDraft(event.target.value as RequestStatus | "")}
                    >
                      <option value="">Select status</option>
                      {REQUEST_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                  <div className="requests-status-actions">
                    <button type="button" onClick={() => { setStatusDraft(""); setStatusFilter(""); setStatusCondition("IS"); setStatusConditionDraft("IS"); setPage(1); setStatusOpen(false); }}>Clear</button>
                    <button type="button" onClick={() => { setStatusFilter(statusDraft); setStatusCondition(statusConditionDraft); setPage(1); setStatusOpen(false); }}>Apply</button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                aria-expanded={filtersOpen}
                onClick={() => { setFiltersOpen((open) => !open); setStatusOpen(false); }}
                className="requests-add-filter"
              >
                <span className="inline-flex items-center gap-2"><Plus className="size-4" aria-hidden="true" />Add Filters</span>
                <ChevronDown className={filtersOpen ? "size-4 rotate-180 transition-transform" : "size-4 transition-transform"} aria-hidden="true" />
              </Button>
              {filtersOpen ? (
                <div role="dialog" aria-label="Available request filters" className="requests-filter-options">
                  <label className="sr-only" htmlFor="request-filter-search">Search filters</label>
                  <input
                    id="request-filter-search"
                    type="search"
                    value={filterSearch}
                    onChange={(event) => setFilterSearch(event.target.value)}
                    placeholder="Search"
                    className="requests-filter-search"
                  />
                  <div role="listbox" aria-label="Option List" aria-multiselectable="true" className="requests-filter-option-list">
                    {REQUEST_FILTER_OPTIONS.filter((item) => item.label.toLowerCase().includes(filterSearch.toLowerCase())).map((item) => {
                      const checked = selectedFilterFields.includes(item.id);
                      return (
                        <label key={item.id} className="requests-filter-option">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedFilterFields((fields) => checked ? fields.filter((field) => field !== item.id) : [...fields, item.id]);
                              if (item.id === "RequestType") setRequestTypeFilterOpen(!checked);
                            }}
                          />
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <Button
              type="button"
              variant="outline"
              aria-label="Apply request filters"
              title="Apply filters"
              onClick={() => { setPage(1); setReloadKey((value) => value + 1); setFiltersOpen(false); setStatusOpen(false); }}
              className="requests-apply-filter"
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
