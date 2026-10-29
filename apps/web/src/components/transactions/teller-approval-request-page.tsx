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
  rejectRequest,
  type RequestDetail,
} from "@/lib/transactions";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load the request.";
}

export function TellerApprovalRequestPage() {
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
    if (!id) return;
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
          setError(failureMessage(failure));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
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
    } catch (failure) {
      setError(failureMessage(failure));
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
    } catch (failure) {
      setError(failureMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Teller approval request"
        description="Approve or reject a queued teller action."
      />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <label className="mb-1 block fs-text font-medium text-body" htmlFor="request-id">
          Request ID
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            id="request-id"
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder="Paste a request ID"
            className="h-[var(--control-height)] max-w-md"
          />
        </div>
      </section>

      {error ? <ErrorPanel message={error} onRetry={() => setId(id)} /> : null}
      {result ? <p className="fs-text text-accent-teal" role="status">{result}</p> : null}

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
      ) : id ? null : (
        <EmptyState
          icon={CheckCircle2}
          title="No request selected"
          description="Paste a request ID above to review and approve or reject it."
        />
      )}
    </div>
  );
}
