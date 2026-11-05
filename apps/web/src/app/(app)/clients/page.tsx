"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, CopyPlus, Eye, Plus, Search, SlidersHorizontal, UserCheck, UserPlus, UsersRound, UserX, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { listClients, updateClient, type Client } from "@/lib/settings";
import { maskEmail, maskNationalId, maskPhone } from "@/lib/privacy";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

type FilterCondition = "Contains" | "Equals" | "Starts with" | "Ends with" | "Does not contain";

const textConditions: FilterCondition[] = ["Contains", "Equals", "Starts with", "Ends with", "Does not contain"];
const DEFAULT_CLIENT_COLUMNS = ["memberNo", "fullName", "referenceNo", "nationalId", "clientType", "phone", "email", "status", "kycStatus", "joinedAt", "groupName", "actions"];

function matchesTextFilter(source: unknown, value: string, condition: FilterCondition): boolean {
  const field = String(source ?? "").toLocaleLowerCase();
  const needle = value.trim().toLocaleLowerCase();
  if (!needle) return true;
  if (condition === "Equals") return field === needle;
  if (condition === "Starts with") return field.startsWith(needle);
  if (condition === "Ends with") return field.endsWith(needle);
  if (condition === "Does not contain") return !field.includes(needle);
  return field.includes(needle);
}

function clientInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : words[0][1] ?? ""}`.toUpperCase();
}

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<Awaited<ReturnType<typeof listClients>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [clientType, setClientType] = useState(() => searchParams.get("type") ?? "");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_CLIENT_COLUMNS);
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);
  const { pushToast } = useToast();
  const [viewing, setViewing] = useState<Client | null>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [extraFilterFields, setExtraFilterFields] = useState<string[]>([]);
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({});
  const [extraFilterConditions, setExtraFilterConditions] = useState<Record<string, FilterCondition>>({});
  const [filterPopover, setFilterPopover] = useState<"type" | "status" | string | null>(null);
  const [typeDraft, setTypeDraft] = useState(clientType);
  const [statusDraft, setStatusDraft] = useState(status);
  const [extraFilterDraft, setExtraFilterDraft] = useState("");
  const [conditionDraft, setConditionDraft] = useState<FilterCondition>("Contains");
  const [fieldSearch, setFieldSearch] = useState("");
  const [clientActivationOpen, setClientActivationOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem("aimscams:clients:visible-columns");
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((value) => DEFAULT_CLIENT_COLUMNS.includes(value))) setVisibleColumns(parsed);
      }
      } catch { /* ignore invalid local preference */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function toggleColumn(key: string) {
    setVisibleColumns((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
      try { localStorage.setItem("aimscams:clients:visible-columns", JSON.stringify(next)); } catch { /* preference is optional */ }
      return next;
    });
  }

  function toggleSort(field: string) {
    const [currentField, direction] = sort.split(",");
    const next = currentField !== field ? `${field},ASC` : direction === "ASC" ? `${field},DESC` : "";
    setSort(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("sort", next); else params.delete("sort");
    router.push(`${pathname}${params.size ? `?${params.toString()}` : ""}`);
  }

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listClients({ q: query, status, type: clientType, sort })
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
              setError(message(failure, "Could not load clients."));
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
  }, [query, status, clientType, sort, reloadKey]);

  const items = data?.items ?? [];
  const [sortField, sortDirection] = sort.split(",");
  const sortableFields = ["memberNo", "fullName", "referenceNo", "clientType"] as const;
  const sortedItems = sortableFields.includes(sortField as (typeof sortableFields)[number])
    ? [...items].sort((left, right) => {
        const leftValue = sortField === "memberNo" ? left.memberNo ?? left.referenceNo : left[sortField as keyof Client];
        const rightValue = sortField === "memberNo" ? right.memberNo ?? right.referenceNo : right[sortField as keyof Client];
        const order = String(leftValue ?? "").localeCompare(String(rightValue ?? ""), undefined, { numeric: true, sensitivity: "base" });
        return sortDirection === "DESC" ? -order : order;
      })
    : items;
  const extraFilterOptions = [
    { key: "memberNo", label: "Member ID" },
    { key: "fullName", label: "Full Name" },
    { key: "referenceNo", label: "Reference Number" },
    { key: "nationalId", label: "National ID" },
    { key: "phone", label: "Phone number" },
    { key: "email", label: "Email address" },
    { key: "kycStatus", label: "KYC Status" },
    { key: "joinedAt", label: "DOJ" },
    { key: "groupName", label: "Group Name" },
  ] as const;
  const visibleItems = sortedItems.filter((item) => {
    if (clientType && item.clientType !== clientType) return false;
    if (status && item.status !== status) return false;
    return extraFilterFields.every((key) => {
      const value = extraFilters[key] ?? "";
      if (!value.trim()) return true;
      const condition = extraFilterConditions[key] ?? "Contains";
      const fieldValue = item[key as keyof Client];
      if (key === "joinedAt" && condition === "Equals" && value) {
        return Boolean(fieldValue) && new Date(String(fieldValue)).toISOString().slice(0, 10) === value;
      }
      return matchesTextFilter(fieldValue, value, condition);
    });
  });
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstItem = visibleItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, visibleItems.length);
  const hasFilters = Boolean(query.trim() || status || clientType || Object.values(extraFilters).some((value) => value.trim()));
  const openFieldFilter = (key: string) => {
    setExtraFilterDraft(extraFilters[key] ?? "");
    setConditionDraft(extraFilterConditions[key] ?? (key === "joinedAt" ? "Equals" : "Contains"));
    setFilterPopover(key);
  };
  const applyFieldFilter = (key: string) => {
    setExtraFilters((current) => ({ ...current, [key]: extraFilterDraft }));
    setExtraFilterConditions((current) => ({ ...current, [key]: conditionDraft }));
    setPage(1);
    setFilterPopover(null);
  };

  return (
    <div className="space-y-[15px]">
      <PageHeader
        variant="card"
        icon={<UsersRound className="size-[19.33px] shrink-0 text-primary" aria-hidden="true" />}
        title="Clients"
        titleClassName="text-[20.16px] font-semibold leading-[normal] tracking-[normal]"
        className="min-h-[69.33px] px-[19.33px] py-[20.16px] sm:pl-[20.67px] sm:pr-[19.33px] [&>div:first-child]:gap-[10.67px]"
        actions={data?.canCreate ? (
          <>
            <Button asChild variant="outline" className="!h-[28.77px] !w-[88.59px] !gap-[4px] !border-primary !px-2 text-[11.76px] font-semibold text-primary">
              <Link href="/clients/create"><UserPlus aria-hidden="true" className="size-[14px]" />Add Client</Link>
            </Button>
            <Button asChild variant="outline" className="!h-[28.77px] !w-[89.74px] !gap-[4px] !border-primary !px-2 text-[11.76px] font-semibold text-primary">
              <Link href="/clients/create-group"><UsersRound aria-hidden="true" className="size-[14px]" />Add Group</Link>
            </Button>
            <Button variant="outline" className="!h-[28.77px] !w-[143.41px] !gap-[4px] !border-primary !px-2 text-[11.76px] font-semibold text-primary" onClick={() => setClientActivationOpen(true)}>
              <CopyPlus aria-hidden="true" className="size-[14px]" />Client Invitation Link
            </Button>
          </>
        ) : null}
      />

      <section className="rounded-t-[var(--card-radius)] border border-card-border bg-surface px-[10.67px] py-[11.33px]">
        <div className="flex flex-col gap-[7.33px] sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[191px] sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="client-search"
              aria-label="Search clients"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Search"
              className="!h-[34.13px] !border-primary !pl-[33.6px]"
            />
          </div>
          <div className="relative shrink-0">
            <Button type="button" variant="outline" aria-expanded={filterPopover === "type"} onClick={() => { setTypeDraft(clientType); setFilterPopover(filterPopover === "type" ? null : "type"); }} className="h-[34.93px] w-[67.05px] justify-between gap-1 !border-primary !px-2 !text-primary">
              Type <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
            {filterPopover === "type" ? (
              <div role="dialog" aria-label="Filter by Type" className="absolute left-0 top-full z-30 mt-1 flex min-h-[290px] w-[350px] flex-col rounded-md border border-card-border bg-surface p-6 shadow-lg">
                <p className="mb-2 fs-text font-semibold text-strong">Type</p>
                <label className="mb-1 block fs-text text-muted-foreground" htmlFor="client-type-condition">Condition</label>
                <select id="client-type-condition" value="Is" disabled className="mb-3 h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text"><option>Is</option></select>
                <label className="mb-1 block fs-text text-muted-foreground" htmlFor="client-type">Value</label>
                <select id="client-type" value={typeDraft} onChange={(event) => setTypeDraft(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text">
                  <option value="">Select type</option>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="GROUP">Group</option>
                </select>
                <div className="mt-auto flex justify-end gap-2 border-t border-card-border pt-3">
                  <Button type="button" variant="outline" className="!border-primary !text-primary" disabled={!clientType && !typeDraft} onClick={() => { setTypeDraft(""); setClientType(""); setPage(1); setFilterPopover(null); }}>Clear</Button>
                  <Button type="button" className="disabled:!border-card-border disabled:!bg-subtle disabled:!text-muted-foreground disabled:!opacity-100" disabled={typeDraft === clientType} onClick={() => { setClientType(typeDraft); setPage(1); setFilterPopover(null); }}>Apply</Button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="relative shrink-0">
            <Button type="button" variant="outline" aria-expanded={filterPopover === "status"} onClick={() => { setStatusDraft(status); setFilterPopover(filterPopover === "status" ? null : "status"); }} className="h-[34.93px] w-[75.53px] justify-between gap-1 !border-primary !px-2 !text-primary">
              Status <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
            {filterPopover === "status" ? (
              <div role="dialog" aria-label="Filter by Status" className="absolute left-0 top-full z-30 mt-1 flex min-h-[290px] w-[350px] flex-col rounded-md border border-card-border bg-surface p-6 shadow-lg">
                <p className="mb-2 fs-text font-semibold text-strong">Status</p>
                <label className="mb-1 block fs-text text-muted-foreground" htmlFor="client-status-condition">Condition</label>
                <select id="client-status-condition" value="Is" disabled className="mb-3 h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text"><option>Is</option></select>
                <label className="mb-1 block fs-text text-muted-foreground" htmlFor="client-status">Value</label>
                <select id="client-status" value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text">
                  <option value="">Select status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                </select>
                <div className="mt-auto flex justify-end gap-2 border-t border-card-border pt-3">
                  <Button type="button" variant="outline" className="!border-primary !text-primary" disabled={!status && !statusDraft} onClick={() => { setStatusDraft(""); setStatus(""); setPage(1); setFilterPopover(null); }}>Clear</Button>
                  <Button type="button" className="disabled:!border-card-border disabled:!bg-subtle disabled:!text-muted-foreground disabled:!opacity-100" disabled={statusDraft === status} onClick={() => { setStatus(statusDraft); setPage(1); setFilterPopover(null); }}>Apply</Button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="relative w-full sm:w-[144px]">
            <Button
              type="button"
              variant="outline"
              aria-expanded={filterMenuOpen}
              aria-controls="client-extra-filters"
              className="h-[34.13px] w-[131.33px] justify-between !border-primary !text-primary"
              onClick={() => setFilterMenuOpen((open) => !open)}
            >
              <span className="inline-flex items-center gap-2"><Plus aria-hidden="true" />Add Filters</span>
              <ChevronDown aria-hidden="true" />
            </Button>
            {filterMenuOpen ? (
              <div id="client-extra-filters" role="group" aria-label="Additional client filters" className="absolute left-0 top-full z-30 mt-1 w-64 rounded-md border border-card-border bg-surface p-2 shadow-lg">
                <Input aria-label="Search filters" placeholder="Search filters" value={fieldSearch} onChange={(event) => setFieldSearch(event.target.value)} className="mb-1 h-9" />
                <div className="max-h-64 overflow-y-auto">
                {extraFilterOptions.filter(({ label }) => label.toLocaleLowerCase().includes(fieldSearch.toLocaleLowerCase())).map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 fs-text hover:bg-subtle">
                    <input
                      type="checkbox"
                      checked={extraFilterFields.includes(key)}
                      onChange={(event) => {
                        setExtraFilterFields((current) => event.target.checked ? [...current, key] : current.filter((field) => field !== key));
                        setPage(1);
                        if (!event.target.checked) {
                          setExtraFilters((current) => ({ ...current, [key]: "" }));
                          if (filterPopover === key) setFilterPopover(null);
                        } else {
                          setExtraFilters((current) => ({ ...current, [key]: current[key] ?? "" }));
                        }
                      }}
                    />
                    {label}
                  </label>
                ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {extraFilterFields.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {extraFilterOptions.filter(({ key }) => extraFilterFields.includes(key)).map(({ key, label }) => (
              <div key={key} className="relative">
                <div className="flex items-center rounded border border-primary/50 bg-background text-primary">
                  <Button type="button" variant="ghost" aria-expanded={filterPopover === key} className="h-9 !px-2 fs-text !text-primary" onClick={() => filterPopover === key ? setFilterPopover(null) : openFieldFilter(key)}>
                    Filter by {label}
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove ${label} filter`} className="!size-7 !text-primary" onClick={() => { setExtraFilterFields((current) => current.filter((field) => field !== key)); setExtraFilters((current) => ({ ...current, [key]: "" })); setPage(1); setFilterPopover(null); }}>
                    <X aria-hidden="true" className="size-3" />
                  </Button>
                </div>
                {filterPopover === key ? (
                  <div role="dialog" aria-label={`Filter by ${label}`} className="absolute left-0 top-full z-30 mt-1 w-72 rounded-md border border-card-border bg-surface p-3 shadow-lg">
                    <p className="mb-2 fs-text font-semibold text-strong">{label}</p>
                    <label className="mb-1 block fs-text text-muted-foreground" htmlFor={`condition-${key}`}>Condition</label>
                    <select id={`condition-${key}`} value={conditionDraft} onChange={(event) => setConditionDraft(event.target.value as FilterCondition)} className="mb-3 h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text">
                      {(key === "joinedAt" ? ["Equals"] : textConditions).map((condition) => <option key={condition}>{condition}</option>)}
                    </select>
                    <label className="mb-1 block fs-text text-muted-foreground" htmlFor={`value-${key}`}>Value</label>
                    <Input id={`value-${key}`} type={key === "joinedAt" ? "date" : "text"} placeholder={`Enter ${label}`} value={extraFilterDraft} onChange={(event) => setExtraFilterDraft(event.target.value)} className="h-[var(--control-height)]" />
                    <div className="mt-3 flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setExtraFilterDraft(""); setExtraFilters((current) => ({ ...current, [key]: "" })); setPage(1); setFilterPopover(null); }}>Clear</Button>
                      <Button type="button" size="sm" onClick={() => applyFieldFilter(key)}>Apply</Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            <span className="fs-text text-muted-foreground">{extraFilterFields.length} added</span>
          </div>
        ) : null}
      </section>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view clients. Ask an administrator for Client : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : visibleItems.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No client matches" : "No clients yet"}
          description={hasFilters ? "Adjust or clear the filters to see other clients." : "Add a client to begin."}
        />
      ) : (
        <section className="-mt-[18px] overflow-hidden rounded-b-[var(--card-radius)] border border-t-0 border-card-border bg-card">
          <div className="table-scroll overflow-x-auto">
            <table className="w-full min-w-[1495px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                <tr>
                  {([
                    ["memberNo", "Member Id"], ["fullName", "Full Name"], ["referenceNo", "Reference Number"],
                    ["nationalId", "National Id"], ["clientType", "Type"], ["phone", "Phone Number"],
                    ["email", "Email Address"], ["status", "Status"], ["kycStatus", "KYC Status"],
                    ["joinedAt", "DOJ"], ["groupName", "Group Name"],
                  ] as const).map(([key, label]) => {
                    const sortField = key;
                    const sortable = ["memberNo", "fullName", "referenceNo", "clientType"].includes(sortField);
                    const activeSort = sort.startsWith(`${sortField},`) ? sort.split(",")[1] : "";
                    return <th key={key} hidden={!visibleColumns.includes(key)} className={`!h-[37.48px] whitespace-nowrap px-4 !py-0 ${activeSort ? "bg-[#e6f6f4] text-primary" : ""}`}>
                      {sortable ? <button type="button" data-sortable="true" data-sort={activeSort || undefined} onClick={() => toggleSort(sortField)} className="inline-flex h-full w-full items-center justify-between gap-2 text-left font-semibold">
                        {label}{activeSort ? <span aria-label={activeSort === "ASC" ? "Sort ascending" : "Sort descending"}>{activeSort === "ASC" ? "↑" : "↓"}</span> : null}
                      </button> : <span className="font-semibold">{label}</span>}
                    </th>;
                  })}
                  <th scope="col" aria-label="Actions" hidden={!visibleColumns.includes("actions")} className="sticky right-0 z-10 !h-[37.48px] min-w-[52px] bg-subtle px-3 !py-0 text-right">
                    <div className="relative flex justify-end">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Column settings" aria-expanded={columnSettingsOpen} onClick={() => setColumnSettingsOpen((open) => !open)} className="size-7 text-muted-foreground hover:text-primary"><SlidersHorizontal className="size-4" aria-hidden="true" /></Button>
                      {columnSettingsOpen ? <div role="group" aria-label="Columns" className="absolute right-0 top-full z-30 mt-1 w-52 rounded-md border border-card-border bg-surface p-2 shadow-lg">{([
                        ["memberNo", "Member Id"], ["fullName", "Full Name"], ["referenceNo", "Reference Number"], ["nationalId", "National Id"], ["clientType", "Type"], ["phone", "Phone Number"], ["email", "Email Address"], ["status", "Status"], ["kycStatus", "KYC Status"], ["joinedAt", "DOJ"], ["groupName", "Group Name"], ["actions", "Actions"],
                      ] as const).map(([key, label]) => <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 fs-text hover:bg-subtle"><input type="checkbox" checked={visibleColumns.includes(key)} onChange={() => toggleColumn(key)} />{label}</label>)}</div> : null}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item: Client) => (
                  <tr key={item.id} className="!h-[57.77px] border-b border-card-border last:border-0">
                    <td hidden={!visibleColumns.includes("memberNo")} className="whitespace-nowrap !h-[57.77px] px-4 !py-0 font-normal text-body">{item.memberNo ?? item.referenceNo}</td>
                    <td hidden={!visibleColumns.includes("fullName")} className="whitespace-nowrap !h-[57.77px] px-4 !py-0 text-body"><div className="flex items-center gap-[10.67px]"><span data-client-avatar className="grid size-[36px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#168888] to-[#377ab1] text-[13px] font-bold text-white">{clientInitials(item.fullName)}</span><span>{item.fullName}</span></div></td>
                    <td hidden={!visibleColumns.includes("referenceNo")} className="whitespace-nowrap !h-[57.77px] px-4 !py-0 text-body">{item.referenceNo}</td>
                    <td hidden={!visibleColumns.includes("nationalId")} className="whitespace-nowrap !h-[57.77px] px-4 !py-0 text-body">{item.nationalId ? <span data-national-id className="inline-flex h-[19.33px] items-center rounded-[4px] bg-[#e7f1ff] px-[6.67px] text-[11.76px] font-bold text-[#084298]">{maskNationalId(item.nationalId)}</span> : "N/A"}</td>
                    <td hidden={!visibleColumns.includes("clientType")} className="whitespace-nowrap !h-[57.77px] px-4 !py-0 text-body">{titleCase(item.clientType)}</td>
                    <td hidden={!visibleColumns.includes("phone")} className="whitespace-nowrap !h-[57.77px] px-4 !py-0 text-body">{item.phone ? <span data-testid="verification-pill" data-verified={item.phoneVerified} className={`inline-flex h-[19.33px] items-center rounded-[4px] px-[6.67px] text-[11.76px] font-bold ${item.phoneVerified ? "bg-[#d1e7dd] text-[#146c43]" : "bg-[#f8d7da] text-[#b02a37]"}`}>{maskPhone(item.phone)}</span> : "N/A"}</td>
                    <td hidden={!visibleColumns.includes("email")} className="whitespace-nowrap !h-[57.77px] px-4 !py-0 text-body">{item.email ? <span data-testid="verification-pill" data-verified={item.emailVerified} className={`inline-flex h-[19.33px] items-center rounded-[4px] px-[6.67px] text-[11.76px] font-bold ${item.emailVerified ? "bg-[#d1e7dd] text-[#146c43]" : "bg-[#f8d7da] text-[#b02a37]"}`}>{maskEmail(item.email)}</span> : "N/A"}</td>
                    <td hidden={!visibleColumns.includes("status")} className="whitespace-nowrap !h-[57.77px] px-4 !py-0">
                      <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td hidden={!visibleColumns.includes("kycStatus")} className="whitespace-nowrap !h-[57.77px] px-4 !py-0 text-body">{titleCase(item.kycStatus)}</td>
                    <td hidden={!visibleColumns.includes("joinedAt")} className="whitespace-nowrap !h-[57.77px] px-4 !py-0 text-body">{item.joinedAt ? new Date(item.joinedAt).toLocaleDateString() : "—"}</td>
                    <td hidden={!visibleColumns.includes("groupName")} className="whitespace-nowrap !h-[57.77px] px-4 !py-0 text-body">{item.groupName ?? "N/A"}</td>
                    <td hidden={!visibleColumns.includes("actions")} className="sticky right-0 z-[1] whitespace-nowrap !h-[57.77px] bg-[#f8f9fa] px-3 !py-0">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          label={`${item.referenceNo} ${item.fullName}`}
                          actions={[
                            { label: "View", icon: Eye, href: `/clients/${item.id}` },
                            ...(data?.canEdit ? [{ label: "Edit", icon: UserCheck, href: `/clients/${item.id}/edit` }] : []),
                            ...(data?.canEdit
                              ? [
                                  {
                                    label: item.status === "ACTIVE" ? "Deactivate client" : "Activate client",
                                    icon: item.status === "ACTIVE" ? UserX : UserCheck,
                                    onSelect: async () => {
                                      const next = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                                      await updateClient(item.id, { status: next });
                                      pushToast(`Client ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
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
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-card-border px-3 py-2 fs-text text-muted-foreground">
            <span aria-live="polite">Showing {firstItem} to {lastItem} of {visibleItems.length} entries</span>
            <nav aria-label="Client list pages" className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon-xs" aria-label="First page" disabled={currentPage === 1} onClick={() => setPage(1)}>
                <ChevronsLeft aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" size="icon-xs" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft aria-hidden="true" />
              </Button>
              <span aria-current="page" className="grid size-10 place-items-center rounded-full bg-primary-tint text-primary">{currentPage}</span>
              <Button type="button" variant="ghost" size="icon-xs" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
                <ChevronRight aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" size="icon-xs" aria-label="Last page" disabled={currentPage >= pageCount} onClick={() => setPage(pageCount)}>
                <ChevronsRight aria-hidden="true" />
              </Button>
            </nav>
            <label className="sr-only" htmlFor="client-page-size">Rows per page</label>
            <div className="w-[80px] shrink-0">
              <select id="client-page-size" aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
          </div>
        </section>
      )}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `${viewing.fullName}` : "Client details"}
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing ? (
          <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-14)] md:grid-cols-2">
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Member ID</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.memberNo ?? viewing.referenceNo}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Reference number</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.referenceNo}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">National ID</dt>
              <dd className="mt-1 fs-text text-strong">{maskNationalId(viewing.nationalId)}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Type</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.clientType}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Phone</dt>
              <dd className="mt-1 fs-text text-strong">{maskPhone(viewing.phone)}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1 fs-text text-strong">{maskEmail(viewing.email)}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.status}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">KYC status</dt>
              <dd className="mt-1 fs-text text-strong">{titleCase(viewing.kycStatus)}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">DOJ</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.joinedAt ? new Date(viewing.joinedAt).toLocaleDateString() : "—"}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Group</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.groupName ?? "N/A"}</dd>
            </div>
          </dl>
        ) : null}
      </Modal>
      <Modal
        open={clientActivationOpen}
        onClose={() => setClientActivationOpen(false)}
        title="Client activation link"
        footer={<Button variant="outline" onClick={() => setClientActivationOpen(false)}>Close</Button>}
      >
        <p className="fs-text text-body">Client activation links are not configured for this installation yet.</p>
      </Modal>
    </div>
  );
}
