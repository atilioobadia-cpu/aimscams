"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Eye, Link2, Plus, Search, UserCheck, UserPlus, UsersRound, UserX } from "lucide-react";
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
    { key: "nationalId", label: "National ID" },
    { key: "phone", label: "Phone number" },
    { key: "email", label: "Email address" },
    { key: "groupName", label: "Group" },
  ] as const;
  const visibleItems = items.filter((item) => {
    if (clientType && item.clientType !== clientType) return false;
    if (status && item.status !== status) return false;
    return extraFilterFields.every((key) => {
      const value = extraFilters[key]?.trim().toLocaleLowerCase();
      if (!value) return true;
      const fieldValue = item[key as keyof Client];
      return String(fieldValue ?? "").toLocaleLowerCase().includes(value);
    });
  });
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstItem = visibleItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, visibleItems.length);
  const hasFilters = Boolean(query.trim() || status || clientType || Object.values(extraFilters).some((value) => value.trim()));

  return (
    <div className="space-y-[18px]">
      <PageHeader
        variant="card"
        icon={<UsersRound className="size-6 shrink-0 text-primary" aria-hidden="true" />}
        title="Clients"
        actions={data?.canCreate ? (
          <>
            <Button asChild variant="outline" className="!border-primary !gap-1 !px-[10px] !text-[14px] font-semibold text-primary">
              <Link href="/clients/create"><UserPlus aria-hidden="true" />Add client</Link>
            </Button>
            <Button asChild variant="outline" className="!border-primary !gap-1 !px-[10px] !text-[14px] font-semibold text-primary">
              <Link href="/clients/create-group"><UsersRound aria-hidden="true" />Add group</Link>
            </Button>
            <Button variant="outline" className="!border-primary !gap-1 !px-[10px] !text-[14px] font-semibold text-primary" onClick={() => setClientActivationOpen(true)}>
              <Link2 aria-hidden="true" />Client activation link
            </Button>
          </>
        ) : null}
      />

      <section className="rounded-t-[var(--card-radius)] border border-card-border bg-surface px-3 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[230px] sm:flex-none">
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
          <div className="w-full shrink-0 sm:w-[80px]">
            <label className="sr-only" htmlFor="client-type">Type</label>
            <select
              id="client-type"
              aria-label="Type"
              value={clientType}
              onChange={(event) => { setClientType(event.target.value); setPage(1); }}
              className="h-[var(--control-height)] rounded-[var(--control-radius)] !border-primary bg-background px-3 fs-text"
            >
              <option value="">Type</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="GROUP">Group</option>
            </select>
          </div>
          <div className="w-full shrink-0 sm:w-[90px]">
            <label className="sr-only" htmlFor="client-status">Status</label>
            <select
              id="client-status"
              aria-label="Status"
              value={status}
              onChange={(event) => { setStatus(event.target.value); setPage(1); }}
              className="h-[var(--control-height)] rounded-[var(--control-radius)] !border-primary bg-background px-3 fs-text"
            >
              <option value="">Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div className="relative w-full sm:w-[158px]">
            <Button
              type="button"
              variant="outline"
              aria-expanded={filterMenuOpen}
              aria-controls="client-extra-filters"
              className="w-full justify-between !border-primary !text-primary"
              onClick={() => setFilterMenuOpen((open) => !open)}
            >
              <span className="inline-flex items-center gap-2"><Plus aria-hidden="true" />Add filters</span>
              <ChevronDown aria-hidden="true" />
            </Button>
            {filterMenuOpen ? (
              <div id="client-extra-filters" role="group" aria-label="Additional client filters" className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-card-border bg-surface p-2 shadow-lg">
                {extraFilterOptions.map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 fs-text hover:bg-subtle">
                    <input
                      type="checkbox"
                      checked={extraFilterFields.includes(key)}
                      onChange={(event) => {
                        setExtraFilterFields((current) => event.target.checked ? [...current, key] : current.filter((field) => field !== key));
                        setPage(1);
                        if (!event.target.checked) setExtraFilters((current) => ({ ...current, [key]: "" }));
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        {extraFilterFields.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {extraFilterOptions.filter(({ key }) => extraFilterFields.includes(key)).map(({ key, label }) => (
              <Input
                key={key}
                aria-label={label}
                placeholder={label}
                value={extraFilters[key] ?? ""}
                onChange={(event) => { setExtraFilters((current) => ({ ...current, [key]: event.target.value })); setPage(1); }}
                className="h-[var(--control-height)] w-full sm:w-[230px]"
              />
            ))}
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
                  <th className="px-4 py-3">Member ID</th>
                  <th className="px-4 py-3">Full name</th>
                  <th className="px-4 py-3">Ref number</th>
                  <th className="px-4 py-3">National ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">KYC status</th>
                  <th className="px-4 py-3">DOJ</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3 text-right">Action</th>
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
