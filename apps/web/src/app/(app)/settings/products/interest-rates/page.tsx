"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Plus, Search, UserCheck, UserX } from "lucide-react";
import Link from "next/link";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu, type RowAction } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { listInterestRates, updateInterestRate, type InterestRate, type InterestRateStatus } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function InterestRatesPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listInterestRates>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | InterestRateStatus>("");
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);
  const { pushToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listInterestRates({ q: query, status })
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
              setError(message(failure, "Could not load interest rates."));
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

  const rates = data?.items ?? [];
  const hasFilters = Boolean(query.trim() || status);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Interest rates" description="Interest rate definitions used by products." />
        {data?.canEdit ? (
          <Button asChild className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
            <Link href="/settings/products/interest-rates/new">Create interest rate</Link>
          </Button>
        ) : null}
      </div>

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="interest-rate-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="interest-rate-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Code or name"
                className="h-[var(--control-height)] pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-[220px]">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="interest-rate-status">
              Status
            </label>
            <select
              id="interest-rate-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as "" | InterestRateStatus)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view interest rates. Ask an administrator for Settings Product : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : rates.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No interest rate matches" : "No interest rates yet"}
          description={hasFilters ? "Adjust or clear the filters to see other rates." : "Create an interest rate definition for products."}
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold uppercase tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Rate</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Effective from</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.id} className="border-b border-card-border last:border-0">
                    <td className="px-4 py-3 font-medium text-strong">{rate.code}</td>
                    <td className="px-4 py-3 text-body">{rate.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={rate.status === "ACTIVE" ? "default" : "outline"}>{rate.status}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-body">{(rate.rateBp / 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-body">{rate.period}</td>
                    <td className="px-4 py-3 text-body">{rate.effectiveFrom ? new Date(rate.effectiveFrom).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          label={`${rate.code} ${rate.name}`}
                          actions={
                            data?.canEdit
                              ? [
                                  {
                                    label: rate.status === "ACTIVE" ? "Deactivate" : "Activate",
                                    icon: rate.status === "ACTIVE" ? UserX : UserCheck,
                                    onSelect: async () => {
                                      const next = rate.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                                      await updateInterestRate(rate.id, { status: next });
                                      pushToast(`Interest rate ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
                                      setReloadKey((value) => value + 1);
                                    },
                                  },
                                ]
                              : []
                          }
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
