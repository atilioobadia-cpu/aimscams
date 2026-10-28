"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, Eye, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { listLoans, type Loan } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function LoansPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listLoans>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);
        void listLoans({ q: query, status })
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
              setError(message(failure, "Could not load loans."));
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
      <PageHeader title="Loans" description="Loan accounts created from approved applications." />

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="loan-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="loan-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Loan number, client or product"
                className="h-[var(--control-height)] pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-[220px]">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="loan-status">
              Status
            </label>
            <select
              id="loan-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="">All statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="DISBURSED">Disbursed</option>
              <option value="DELINQUENT">Delinquent</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view loans. Ask an administrator for Loan Account : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No loan matches" : "No loans yet"}
          description={hasFilters ? "Adjust or clear the filters to see other loans." : "Approve a loan application to create a loan."}
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">Loan number</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Principal</th>
                  <th className="px-4 py-3">Outstanding</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: Loan) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.loanNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.clientName ?? "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.productName ?? item.productCode ?? "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(item.principalMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(item.outstandingPrincipalMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          label={item.loanNumber}
                          actions={[
                            {
                              label: "View details",
                              icon: Eye,
                              href: `/account-loan-details/${item.id}`,
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