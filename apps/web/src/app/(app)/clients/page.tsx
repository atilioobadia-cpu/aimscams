"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Eye, Link2, Plus, Search, UserCheck, UserPlus, UsersRound, UserX, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

export default function ClientsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Awaited<ReturnType<typeof listClients>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [clientType, setClientType] = useState(() => searchParams.get("type") ?? "");
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
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listClients({ q: query, status, type: clientType })
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
  }, [query, status, clientType, reloadKey]);

  const items = data?.items ?? [];
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
  const visibleItems = items.filter((item) => {
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
    <div className="space-y-[18px]">
      <PageHeader
        variant="card"
        icon={<UsersRound className="size-6 shrink-0 text-primary" aria-hidden="true" />}
        title="Clients"
        actions={data?.canCreate ? (
          <>
            <Button asChild variant="outline" className="!border-primary !gap-1 !px-2 font-semibold text-primary">
              <Link href="/clients/create"><UserPlus aria-hidden="true" />Add client</Link>
            </Button>
            <Button asChild variant="outline" className="!border-primary !gap-1 !px-2 font-semibold text-primary">
              <Link href="/clients/create-group"><UsersRound aria-hidden="true" />Add group</Link>
            </Button>
            <Button variant="outline" className="!border-primary !gap-1 !px-2 font-semibold text-primary" onClick={() => setClientActivationOpen(true)}>
              <Link2 aria-hidden="true" />Client activation link
            </Button>
          </>
        ) : null}
      />

      <section className="rounded-t-[var(--card-radius)] border border-card-border bg-surface px-3 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[210px] sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="client-search"
              aria-label="Search clients"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Search"
              className="h-[var(--control-height)] !border-primary pl-9"
            />
          </div>
          <div className="relative shrink-0">
            <Button type="button" variant="outline" aria-expanded={filterPopover === "type"} onClick={() => { setTypeDraft(clientType); setFilterPopover(filterPopover === "type" ? null : "type"); }} className="h-[var(--control-height)] w-[76px] justify-between gap-2 !border-primary !px-3 !text-primary">
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
            <Button type="button" variant="outline" aria-expanded={filterPopover === "status"} onClick={() => { setStatusDraft(status); setFilterPopover(filterPopover === "status" ? null : "status"); }} className="h-[var(--control-height)] w-[84px] justify-between gap-2 !border-primary !px-3 !text-primary">
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
              className="w-full justify-between !border-primary !text-primary"
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
                  <th className="px-4 py-3">Member Id</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Reference Number</th>
                  <th className="px-4 py-3">National Id</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">KYC Status</th>
                  <th className="px-4 py-3">DOJ</th>
                  <th className="px-4 py-3">Group Name</th>
                  <th scope="col" aria-label="Actions" className="px-4 py-3 text-right" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item: Client) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="px-4 py-6 font-medium text-strong">{item.memberNo ?? item.referenceNo}</td>
                    <td className="px-4 py-6 text-body">{item.fullName}</td>
                    <td className="px-4 py-6 text-body">{item.referenceNo}</td>
                    <td className="px-4 py-6 text-body">{maskNationalId(item.nationalId)}</td>
                    <td className="px-4 py-6 text-body">{item.clientType}</td>
                    <td className="px-4 py-6 text-body">{maskPhone(item.phone)}</td>
                    <td className="px-4 py-6 text-body">{maskEmail(item.email)}</td>
                    <td className="px-4 py-6">
                      <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td className="px-4 py-6 text-body">{titleCase(item.kycStatus)}</td>
                    <td className="px-4 py-6 text-body">{item.joinedAt ? new Date(item.joinedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-6 text-body">{item.groupName ?? "N/A"}</td>
                    <td className="px-4 py-6">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          label={`${item.referenceNo} ${item.fullName}`}
                          actions={[
                            { label: "View client", icon: Eye, href: `/clients/${item.id}` },
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
