"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Eye, LoaderCircle, Search, UserCheck, UserX } from "lucide-react";
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
import {
  listLoanProducts,
  updateLoanProduct,
  type LoanProduct,
  type LoanProductStatus,
} from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function LoanProductsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listLoanProducts>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | LoanProductStatus>("");
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);
  const { pushToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        else setLoading(false);
        setError(null);

        void listLoanProducts({ q: query, status })
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
              setError(message(failure, "Could not load loan products."));
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

  const products = data?.items ?? [];
  const hasFilters = Boolean(query.trim() || status);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Loan products"
        description="The live loan product configuration. Accounts snapshot these terms at opening."
      />

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-strong" htmlFor="loan-product-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="loan-product-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Code or name"
                className="h-[var(--control-height)] pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-[220px]">
            <label className="mb-1 block fs-text font-medium text-strong" htmlFor="loan-product-status">
              Status
            </label>
            <select
              id="loan-product-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as "" | LoanProductStatus)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view loan products. Ask an administrator for Settings Product : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No loan product matches" : "No loan products yet"}
          description={
            hasFilters
              ? "Adjust or clear the filters to see other products."
              : "Loan products are configured by an administrator and snapshotted onto accounts."
          }
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold uppercase tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Interest rate</th>
                  <th className="px-4 py-3">Tenure (months)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-card-border last:border-0">
                    <td className="px-4 py-3 font-medium text-strong">{product.code}</td>
                    <td className="px-4 py-3 text-body">{product.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.status === "ACTIVE" ? "default" : "outline"}>{product.status}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-body">{(product.interestRateBp / 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 tabular-nums text-body">
                      {product.minTenureMonths}–{product.maxTenureMonths}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          label={`${product.code} ${product.name}`}
                          actions={[
                            {
                              label: "View product",
                              icon: Eye,
                              href: `/settings/products/loan/${product.id}`,
                            },
                            ...(data?.canEdit
                              ? [
                                  {
                                    label: product.status === "ACTIVE" ? "Deactivate product" : "Activate product",
                                    icon: product.status === "ACTIVE" ? UserX : UserCheck,
                                    onSelect: async () => {
                                      const next = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                                      await updateLoanProduct(product.id, { status: next });
                                      pushToast(`Loan product ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
                                      setReloadKey((value) => value + 1);
                                    },
                                  },
                                ]
                              : []),
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
