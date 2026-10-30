"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import {
  approveRequest,
  getRequest,
  listRequests,
  rejectRequest,
  type RequestDetail,
  type RequestItem,
  type RequestList,
} from "@/lib/transactions";

function failureMessage(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export function TellerApprovalRequestPage() {
  const [queue, setQueue] = useState<RequestList | null>(null);
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
        <PageHeader title="Teller approval request" description="Approve or reject a queued teller action." breadcrumb="Transactions" />
        <ForbiddenPanel message="Your role cannot view teller requests. Ask an administrator for Transaction : View." />
      </div>
    );
  }

  const items = queue?.items ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="Teller approval request" description="Approve or reject a queued teller action." breadcrumb="Transactions" />

      {queueError ? <ErrorPanel message={queueError} onRetry={() => setReloadKey((value) => value + 1)} /> : null}
      {error ? <ErrorPanel message={error} onRetry={() => setId(id)} /> : null}
      {result ? <p className="fs-text text-accent-teal" role="status">{result}</p> : null}

      <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-card-border px-[var(--space-16)] py-[var(--space-10)]">
          <p className="fs-text text-muted-foreground">
            {items.length} pending request{items.length === 1 ? "" : "s"}
          </p>
        </div>
        {queueLoading ? (
          <PanelSkeleton rows={6} />
        ) : items.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No pending requests" description="All teller requests have been reviewed." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Date</th>
                  <th className="whitespace-nowrap px-4 py-3">Request</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                  <th className="whitespace-nowrap px-4 py-3">Requester</th>
                  <th className="whitespace-nowrap px-4 py-3">Current assignee</th>
                  <th className="whitespace-nowrap px-4 py-3">Approved by</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.requestNo}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={item.status === "PENDING" ? "outline" : "default"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.requestedBy}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.currentAssignee}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.approvedBy}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => selectRequest(item)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
