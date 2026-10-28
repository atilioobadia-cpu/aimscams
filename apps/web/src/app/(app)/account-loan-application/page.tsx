"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, Plus, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { listLoanApplications, type LoanApplication } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function tenureLabel(application: LoanApplication): string {
  return `${application.tenureCount} ${application.tenurePeriod.toLowerCase()}`;
}

const DESTINATION_LABELS = {
  BANK: "Bank account",
  MNO: "Mobile money",
  CASH: "Cash at branch",
} as const;

function destinationLabel(application: LoanApplication): string {
  return application.paymentDestination
    ? DESTINATION_LABELS[application.paymentDestination]
    : "N/A";
}

export default function LoanApplicationsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listLoanApplications>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [viewing, setViewing] = useState<LoanApplication | null>(null);
  const firstLoad = useRef(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listLoanApplications({ q: query, status })
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
              setError(message(failure, "Could not load loan applications."));
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
  }, [query, status, reloadKey]);

  const items = data?.items ?? [];
  const hasFilters = Boolean(query.trim() || status);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Loan applications" description="Loan applications submitted by clients." />
        {data?.canCreate ? (
          <Button asChild className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
            <Link href="/account-loan-application-create">
              <Plus className="size-4" aria-hidden="true" />
              New loan application
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="loan-application-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="loan-application-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Application number, client or product"
                className="h-[var(--control-height)] pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-[220px]">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="loan-application-status">
              Status
            </label>
            <select
              id="loan-application-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view loan applications. Ask an administrator for Loan Account : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No loan application matches" : "No loan applications yet"}
          description={hasFilters ? "Adjust or clear the filters to see other applications." : "Create a loan application."}
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">Application number</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Principal</th>
                  <th className="px-4 py-3">Tenure</th>
                  <th className="px-4 py-3">Interest rate</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: LoanApplication) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.applicationNo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.clientName ?? "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.productName ?? item.productCode ?? "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(item.principalMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{tenureLabel(item)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{(item.interestRateBp / 100).toFixed(2)}%</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={item.status === "APPROVED" ? "default" : "outline"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          label={item.applicationNo}
                          actions={[
                            {
                              label: "View details",
                              icon: Eye,
                              onSelect: () => router.push(`/account-loan-application-details/${item.id}`),
                            },
                          ]}
                        />
                      </div>
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
