"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronDown,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { RowActionsMenu, type RowAction } from "@/components/data/row-actions-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
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
  councilLabel,
  listBranches,
  minutesToTime,
  WEEKDAYS,
  type Branch,
  type BranchListResponse,
  type BranchStatus,
} from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

const branchHeaderCellStyle = {
  height: "17px",
  paddingTop: "4px",
  paddingBottom: "4px",
  lineHeight: "normal",
  fontSize: "13.44px",
  fontWeight: 700,
  color: "#495057",
} as const;

export function BranchListPage() {
  const [data, setData] = useState<BranchListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | BranchStatus>("");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showRegion, setShowRegion] = useState(true);
  const [showDistrict, setShowDistrict] = useState(true);
  const [showWard, setShowWard] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewing, setViewing] = useState<Branch | null>(null);
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

  function actionsFor(branch: Branch): RowAction[] {
    const actions: RowAction[] = [
      { label: "View branch", icon: Eye, onSelect: () => setViewing(branch) },
    ];
    if (data?.canEdit) {
      actions.push({
        label: "Edit branch",
        icon: Pencil,
        href: `/settings/branches/${branch.id}`,
        separatorBefore: true,
      });
    }
    return actions;
  }

  return (
    <div className="space-y-[8px]">
      <div className="space-y-[25px]">
      <section className="flex min-h-[65px] shrink-0 items-center pl-[50px] pr-5">
        <h1 className="fs-title text-[20.16px] font-semibold text-heading">Branches</h1>
        {canCreate ? (
          <Button asChild variant="outline" className="ml-auto h-[29px] rounded-[6px] border-primary px-3 text-[11.76px] text-primary hover:bg-primary-tint hover:text-primary">
            <Link href="/settings/branches/new"><Plus className="size-4" aria-hidden="true" />New Branch</Link>
          </Button>
        ) : null}
      </section>

      <section className="overflow-visible">
        <div className="flex min-h-[42px] flex-wrap items-center gap-2 px-[10px]">
          <label className="relative block w-[191px] max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search branches" className="h-[34px] rounded-[6px] border-primary pl-10 text-[13.44px] text-primary placeholder:text-primary" />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="h-[32px] w-[132px] min-w-[132px] justify-between gap-1 rounded-[6px] border-primary px-2 text-[11.76px] text-primary hover:bg-primary-tint hover:text-primary">
                <span className="flex items-center gap-1"><Plus className="size-3.5" aria-hidden="true" />Add Filters</span>
                <ChevronDown className="size-3.5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuCheckboxItem checked={showStatusFilter} onCheckedChange={setShowStatusFilter}>Status</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {hasFilters ? <Button type="button" variant="ghost" onClick={clearFilters} className="text-muted-foreground">Clear</Button> : null}
          {refreshing ? <LoaderCircle className="size-4 animate-spin text-primary" aria-label="Updating branches" /> : null}
        </div>
        {showStatusFilter ? (
          <div className="border-b border-chrome px-[var(--space-12)] py-3">
            <select value={status} onChange={(event) => setStatus(event.target.value as "" | BranchStatus)} aria-label="Filter by status" className="h-[42px] min-w-[180px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body">
              <option value="">All statuses</option><option value="OPEN">Open</option><option value="CLOSED">Closed</option>
            </select>
          </div>
        ) : null}
      </section>
      </div>

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
          <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader className="bg-subtle text-[13.44px] font-bold text-[#495057]">
                <TableRow className="h-[37px] hover:bg-subtle">
                  <TableHead className="w-[22%] px-4" style={branchHeaderCellStyle}>Branch Name</TableHead>
                  <TableHead className="w-[13%] px-4" style={branchHeaderCellStyle}>Branch Code</TableHead>
                  <TableHead className="w-[19%] px-4" style={branchHeaderCellStyle}>Address</TableHead>
                  {showRegion ? <TableHead className="px-4" style={branchHeaderCellStyle}>Region</TableHead> : null}
                  {showDistrict ? <TableHead className="px-4" style={branchHeaderCellStyle}>District</TableHead> : null}
                  {showWard ? <TableHead className="px-4" style={branchHeaderCellStyle}>Ward</TableHead> : null}
                  <TableHead className="w-14 text-right" style={branchHeaderCellStyle}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label="Table columns" className="text-primary"><SlidersHorizontal className="size-4" aria-hidden="true" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuCheckboxItem checked={showRegion} onCheckedChange={setShowRegion}>Region</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={showDistrict} onCheckedChange={setShowDistrict}>District</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={showWard} onCheckedChange={setShowWard}>Ward</DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id} className="h-[52px] border-b border-chrome [&>td]:!py-2">
                    <TableCell className="px-4 text-[13.44px] text-body">
                      <Link href={`/settings/branches/${branch.id}`} className="font-medium text-body hover:text-primary hover:underline">{branch.name}</Link>
                      {branch.isDefault ? <span className="ml-2 text-[13.44px] text-primary">(default)</span> : null}
                    </TableCell>
                    <TableCell className="px-4 text-[13.44px] text-body">{branch.code || "N/A"}</TableCell>
                    <TableCell className="px-4 text-[13.44px] text-body">{branch.addressLine || "N/A"}</TableCell>
                    {showRegion ? <TableCell className="px-4 text-[13.44px] text-body">{branch.region || "N/A"}</TableCell> : null}
                    {showDistrict ? <TableCell className="px-4 text-[13.44px] text-body">{branch.district || "N/A"}</TableCell> : null}
                    {showWard ? <TableCell className="px-4 text-[13.44px] text-body">{branch.ward || "N/A"}</TableCell> : null}
                    <TableCell className="w-14 bg-subtle/40 px-2 text-right"><RowActionsMenu label={branch.name} actions={actionsFor(branch)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? "Branch details"}
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing ? (
          <div className="space-y-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Branch code" value={viewing.code} />
              <Detail
                label="Status"
                value={viewing.status === "OPEN" ? "Open" : "Closed"}
              />
              <Detail label="Region" value={viewing.region} />
              <Detail label="District" value={viewing.district || "N/A"} />
              <Detail label="Ward" value={viewing.ward || "N/A"} />
              <Detail label="Council" value={councilLabel(viewing.councilType)} />
              <Detail label="Address" value={viewing.addressLine || "No address recorded"} />
              <Detail label="Default branch" value={viewing.isDefault ? "Yes" : "No"} />
              <Detail label="Staff" value={String(viewing.employeeCount)} />
              <Detail label="User accounts" value={String(viewing.userCount)} />
            </dl>

            <div>
              <h3 className="fs-text font-semibold text-strong">Opening hours</h3>
              <ul className="mt-2 divide-y divide-card-border rounded-lg border border-card-border">
                {WEEKDAYS.map((day) => {
                  const hours = viewing.hours.find((item) => item.weekday === day.value);
                  return (
                    <li
                      key={day.value}
                      className="flex items-center justify-between gap-4 px-3 py-2 fs-text"
                    >
                      <span className="text-label">{day.label}</span>
                      <span className="font-medium text-body">
                        {!hours || hours.isClosed
                          ? "Closed"
                          : `${minutesToTime(hours.opensMinute)} – ${minutesToTime(hours.closesMinute)}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="fs-text font-medium tracking-wide text-label">{label}</dt>
      <dd className="mt-0.5 fs-text text-body">{value}</dd>
    </div>
  );
}
