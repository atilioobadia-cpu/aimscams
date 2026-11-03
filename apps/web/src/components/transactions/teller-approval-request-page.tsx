"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Archive, CheckCircle2, XCircle } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { ColumnPicker, type ColumnOption } from "@/components/data/column-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TellerWorkspaceHeader } from "@/components/transactions/teller-workspace-header";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import {
  approveRequest,
  getRequest,
  getTill,
  listRequests,
  rejectRequest,
  type RequestDetail,
  type RequestItem,
  type RequestList,
  type TillInfo,
} from "@/lib/transactions";

function failureMessage(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

const REQUEST_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "request", label: "Request" },
  { key: "status", label: "Status" },
  { key: "requester", label: "Requester" },
  { key: "assignee", label: "Current Assignee" },
  { key: "approvedBy", label: "Approved by" },
  { key: "id", label: "Id" },
] as const satisfies readonly ColumnOption<string>[];
type RequestColumn = (typeof REQUEST_COLUMNS)[number]["key"];
const DEFAULT_REQUEST_COLUMNS = Object.fromEntries(REQUEST_COLUMNS.map(({ key }) => [key, key !== "id"])) as Record<RequestColumn, boolean>;

export function TellerApprovalRequestPage() {
  const [visibleColumns, setVisibleColumns] = useState<Record<RequestColumn, boolean>>(DEFAULT_REQUEST_COLUMNS);
  const [queue, setQueue] = useState<RequestList | null>(null);
  const [till, setTill] = useState<TillInfo | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [id, setId] = useState("");
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("id");
    if (value) setId(value);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setQueueLoading(true);
      setQueueError(null);
      void listRequests({ status: "PENDING", pageSize: 50 })
        .then((next) => {
          if (cancelled) return;
          setQueue(next);
          setForbidden(false);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) {
            setForbidden(true);
            setQueue(null);
          } else {
            setQueueError(failureMessage(failure, "Could not load the request queue."));
          }
        })
        .finally(() => {
          if (!cancelled) setQueueLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    void getTill()
      .then((next) => {
        if (!cancelled) setTill(next);
      })
      .catch(() => {
        if (!cancelled) setTill(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setRequest(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void getRequest(id)
        .then((next) => {
          if (cancelled) return;
          setRequest(next);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          setError(failureMessage(failure, "Could not load the request."));
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [id]);

  async function handleApprove() {
    if (!request) return;
    setSubmitting(true);
    setError(null);
    try {
      await approveRequest(request.id);
      setResult("Request approved.");
      const next = await getRequest(request.id);
      setRequest(next);
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setError(failureMessage(failure, "Could not approve the request."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!request) return;
    setSubmitting(true);
    setError(null);
    try {
      await rejectRequest(request.id, reason);
      setResult("Request rejected.");
      const next = await getRequest(request.id);
      setRequest(next);
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setError(failureMessage(failure, "Could not reject the request."));
    } finally {
      setSubmitting(false);
    }
  }

  function selectRequest(item: RequestItem) {
    setId(item.id);
    setResult(null);
    setError(null);
  }

  if (forbidden) {
    return (
      <div className="space-y-5">
        <TellerWorkspaceHeader till={till} activeTab="requests" />
        <ForbiddenPanel message="Your role cannot view teller requests. Ask an administrator for Transaction : View." />
      </div>
    );
  }

  const items = queue?.items ?? [];

  return (
    <div className="space-y-1">
      <TellerWorkspaceHeader till={till} activeTab="requests" />

      {queueError ? <ErrorPanel message={queueError} onRetry={() => setReloadKey((value) => value + 1)} /> : null}
      {error ? <ErrorPanel message={error} onRetry={() => setId(id)} /> : null}
      {result ? <p className="fs-text text-accent-teal" role="status">{result}</p> : null}

      <section className="-mt-[3px] overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
        {queueLoading ? <PanelSkeleton rows={6} /> : null}
        {!queueLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  {REQUEST_COLUMNS.filter(({ key }) => key !== "id" && visibleColumns[key]).map(({ key, label }) => <th key={key} scope="col" className="h-[44px] whitespace-nowrap px-3 py-2">{label}</th>)}
                  <th className="h-[44px] w-12 px-2 py-1 text-center"><ColumnPicker columns={[...REQUEST_COLUMNS]} visible={visibleColumns} onToggle={(key, checked) => setVisibleColumns((current) => ({ ...current, [key]: checked }))} onReset={() => setVisibleColumns(DEFAULT_REQUEST_COLUMNS)} /></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={REQUEST_COLUMNS.filter(({ key }) => key !== "id" && visibleColumns[key]).length + 1} className="h-[172px] px-4 text-center text-[rgb(108,117,125)]"><span className="flex flex-col items-center justify-center gap-3"><Archive className="size-9 text-[rgb(108,117,125)]" aria-hidden="true" /><span>No data available</span></span></td>
                  </tr>
                ) : items.map((item) => {
                  const cells: Record<RequestColumn, ReactNode> = {
                    date: new Date(item.createdAt).toLocaleDateString(),
                    request: item.requestNo,
                    status: <Badge variant={item.status === "PENDING" ? "outline" : "default"}>{titleCase(item.status)}</Badge>,
                    requester: item.requestedBy,
                    assignee: item.currentAssignee,
                    approvedBy: item.approvedBy,
                    id: item.id,
                  };
                  return <tr key={item.id} className="border-b border-card-border last:border-0">{REQUEST_COLUMNS.filter(({ key }) => key !== "id" && visibleColumns[key]).map(({ key }) => <td key={key} className="whitespace-nowrap px-3 py-3 text-body">{cells[key]}</td>)}<td className="whitespace-nowrap px-2 py-3 text-center"><Button size="sm" variant="outline" onClick={() => selectRequest(item)}>Review</Button></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={6} />
        </section>
      ) : request ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <p className="fs-text font-medium text-muted-foreground">Request type</p>
              <p className="fs-text font-semibold text-strong">{titleCase(request.requestType.replace(/_/g, " "))}</p>
            </div>
            <div>
              <p className="fs-text font-medium text-muted-foreground">Status</p>
              <Badge variant={request.status === "PENDING" ? "outline" : "default"}>{titleCase(request.status)}</Badge>
            </div>
            <div>
              <p className="fs-text font-medium text-muted-foreground">Amount</p>
              <p className="fs-text text-strong">{request.amountMinor === null ? "N/A" : formatTzs(request.amountMinor)}</p>
            </div>
            <div>
              <p className="fs-text font-medium text-muted-foreground">Branch</p>
              <p className="fs-text text-strong">{request.branchName}</p>
            </div>
            <div>
              <p className="fs-text font-medium text-muted-foreground">Requested by</p>
              <p className="fs-text text-strong">{request.requestedBy}</p>
            </div>
            <div>
              <p className="fs-text font-medium text-muted-foreground">Current assignee</p>
              <p className="fs-text text-strong">{request.currentAssignee}</p>
            </div>
            <div>
              <p className="fs-text font-medium text-muted-foreground">Approved by</p>
              <p className="fs-text text-strong">{request.approvedBy}</p>
            </div>
            <div>
              <p className="fs-text font-medium text-muted-foreground">Created</p>
              <p className="fs-text text-strong">{new Date(request.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {request.reason ? (
            <div>
              <p className="fs-text font-medium text-muted-foreground">Reason</p>
              <p className="fs-text text-strong">{request.reason}</p>
            </div>
          ) : null}
          {request.status === "PENDING" ? (
            <div className="space-y-3 border-t border-card-border pt-3">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="reject-reason">
                  Rejection reason (optional)
                </label>
                <Input
                  id="reject-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Reason for rejection"
                  className="h-[var(--control-height)]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {request.canApprove ? (
                  <Button type="button" onClick={handleApprove} disabled={submitting}>
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    {submitting ? "Approving..." : "Approve"}
                  </Button>
                ) : null}
                {request.canReject ? (
                  <Button type="button" variant="outline" onClick={handleReject} disabled={submitting}>
                    <XCircle className="size-4" aria-hidden="true" />
                    {submitting ? "Rejecting..." : "Reject"}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="fs-text text-muted-foreground">This request has already been {request.status.toLowerCase()}.</p>
          )}
        </section>
      ) : id ? null : null}
    </div>
  );
}
