"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, LoaderCircle, Plus, RotateCcw, Search } from "lucide-react";
import Link from "next/link";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api";
import {
  listBranches,
  type Branch,
  type BranchListResponse,
  type BranchStatus,
} from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function addressLine(branch: Branch): string {
  if (branch.addressLine) return branch.addressLine;
  const parts = [branch.ward, branch.district].filter((part): part is string => Boolean(part));
  return parts.join(" · ");
}

export function BranchListPage() {
  const [data, setData] = useState<BranchListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | BranchStatus>("");
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        else setRefreshing(true);
        setError(null);

        void listBranches({ q: query, status })
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
              setError(message(failure, "Could not load branches."));
            }
          })
          .finally(() => {
            if (cancelled) return;
            firstLoad.current = false;
            setLoading(false);
            setRefreshing(false);
          });
      },
      firstLoad.current ? 0 : 250,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, status, reloadKey]);

  const hasFilters = Boolean(query.trim() || status);
  const branches = data?.items ?? [];
  const canCreate = data?.canCreate ?? false;

  function clearFilters() {
    setQuery("");
    setStatus("");
  }

  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title="Branches"
        description="The branch network, its addresses and each branch's local council type."
        breadcrumb="Settings"
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/settings/branches/new">
                <Plus className="size-4" aria-hidden="true" />
                Add branch
              </Link>
            </Button>
          ) : undefined
        }
      />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-14)]">
        <div className="grid gap-[var(--space-10)] md:grid-cols-[minmax(0,1fr)_190px_auto] md:items-center">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-[var(--space-10)] top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search code, name, region or district"
              aria-label="Search branches"
              className="pl-[var(--space-32)]"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "" | BranchStatus)}
            aria-label="Filter by status"
            className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-fs text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
          <Button type="button" variant="outline" disabled={!hasFilters} onClick={clearFilters}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
      </section>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view branches. Ask an administrator for Settings Branch : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : branches.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No branches match" : "No branches yet"}
          description={
            hasFilters
              ? "Change the search or status filter to see other branches."
              : "Add the first branch so members, users and transactions can be scoped to it."
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canCreate ? (
              <Button asChild>
                <Link href="/settings/branches/new">
                  <Plus className="size-4" aria-hidden="true" />
                  Add branch
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <header className="flex flex-wrap items-center justify-between gap-[var(--space-10)] border-b border-chrome px-[var(--space-14)] py-[var(--space-10)]">
            <h2 className="text-fs font-bold text-strong">Branch network</h2>
            <p className="flex items-center gap-2 text-fs text-muted-foreground" role="status">
              {refreshing ? (
                <LoaderCircle className="size-4 animate-spin text-brand" aria-hidden="true" />
              ) : null}
              {branches.length} {branches.length === 1 ? "branch" : "branches"}
              {hasFilters ? " match" : ""}
            </p>
          </header>
          <Table className="min-w-[960px]">
            <TableHeader className="bg-subtle text-fs font-semibold uppercase tracking-wide text-label">
              <TableRow>
                <TableHead className="px-[var(--space-14)] py-[var(--space-10)]">Branch</TableHead>
                <TableHead className="px-[var(--space-14)] py-[var(--space-10)]">Code</TableHead>
                <TableHead className="px-[var(--space-14)] py-[var(--space-10)]">Region</TableHead>
                <TableHead className="px-[var(--space-14)] py-[var(--space-10)]">Council</TableHead>
                <TableHead className="px-[var(--space-14)] py-[var(--space-10)]">Staff</TableHead>
                <TableHead className="px-[var(--space-14)] py-[var(--space-10)]">Status</TableHead>
                <TableHead className="px-[var(--space-14)] py-[var(--space-10)]">Default</TableHead>
                <TableHead className="px-[var(--space-14)] py-[var(--space-10)] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="px-[var(--space-14)] py-[var(--space-10)] whitespace-normal">
                    <Link
                      href={`/settings/branches/${branch.id}`}
                      className="font-semibold text-strong underline-offset-2 hover:text-brand hover:underline"
                    >
                      {branch.name}
                    </Link>
                    <p className="mt-0.5 max-w-[300px] truncate text-fs text-muted-foreground">
                      {addressLine(branch) || "No address recorded"}
                    </p>
                  </TableCell>
                  <TableCell className="px-[var(--space-14)] py-[var(--space-10)] font-semibold text-body">
                    {branch.code}
                  </TableCell>
                  <TableCell className="px-[var(--space-14)] py-[var(--space-10)] text-body">
                    {branch.region}
                  </TableCell>
                  <TableCell className="px-[var(--space-14)] py-[var(--space-10)] text-body">
                    {branch.councilType ? (
                      <Badge variant="outline">{branch.councilType}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-[var(--space-14)] py-[var(--space-10)] text-body">
                    {branch.employeeCount}
                  </TableCell>
                  <TableCell className="px-[var(--space-14)] py-[var(--space-10)]">
                    <span
                      className={
                        branch.status === "OPEN"
                          ? "inline-flex rounded-[6px] bg-accent-teal-bg px-2 py-0.5 text-fs font-semibold text-brand"
                          : "inline-flex rounded-[6px] bg-subtle px-2 py-0.5 text-fs font-semibold text-label"
                      }
                    >
                      {branch.status === "OPEN" ? "Open" : "Closed"}
                    </span>
                  </TableCell>
                  <TableCell className="px-[var(--space-14)] py-[var(--space-10)]">
                    {branch.isDefault ? (
                      <Badge className="bg-primary-tint text-primary">Default</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-[var(--space-14)] py-[var(--space-10)] text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/settings/branches/${branch.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}
