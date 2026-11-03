"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Search,
  UserCheck,
  UserX,
  Wallet,
  Inbox,
  X,
} from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, FormError, SuccessNote } from "@/components/accounting/states";
import { ColumnPicker } from "@/components/data/column-picker";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { titleCase } from "@/lib/privacy";
import { listClients, listSavingsAccounts, listSavingsProducts, createSavingsAccount, updateSavingsAccount, type Client, type SavingsAccount } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

const extraFilterOptions = [
  { key: "accountNumber", label: "Account number" },
  { key: "memberId", label: "Member ID" },
  { key: "memberName", label: "Member name" },
  { key: "type", label: "Type" },
] as const;

type ExtraFilterKey = (typeof extraFilterOptions)[number]["key"];
type FilterPopover = "product" | "status" | ExtraFilterKey | null;

const emptyExtraFilters: Record<ExtraFilterKey, string> = {
  accountNumber: "",
  memberId: "",
  memberName: "",
  type: "",
};

type SavingsColumnKey = "accountNumber" | "memberId" | "memberName" | "product" | "type" | "creationDate" | "status";
const savingsColumnDefaults: Record<SavingsColumnKey, boolean> = { accountNumber: true, memberId: true, memberName: true, product: true, type: true, creationDate: true, status: true };
const savingsColumns: Array<{ key: SavingsColumnKey; label: string }> = [
  { key: "accountNumber", label: "Account Number" }, { key: "memberId", label: "Member ID" },
  { key: "memberName", label: "Member Name" }, { key: "product", label: "Product" },
  { key: "type", label: "Type" }, { key: "creationDate", label: "Creation Date" }, { key: "status", label: "Status" },
];

export default function SavingsAccountsPage() {
  const { pushToast } = useToast();
  const [data, setData] = useState<Awaited<ReturnType<typeof listSavingsAccounts>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [productIdFilter, setProductIdFilter] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [draftProductId, setDraftProductId] = useState("");
  const [filterPopover, setFilterPopover] = useState<FilterPopover>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");
  const [extraFilterFields, setExtraFilterFields] = useState<ExtraFilterKey[]>([]);
  const [extraFilters, setExtraFilters] = useState<Record<ExtraFilterKey, string>>(emptyExtraFilters);
  const [extraFilterDraft, setExtraFilterDraft] = useState("");
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<Record<SavingsColumnKey, boolean>>(savingsColumnDefaults);
  const [pageSize, setPageSize] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof listSavingsProducts>>["items"]>([]);
  const [clientId, setClientId] = useState("");
  const [productId, setProductId] = useState("");
  const [accountType, setAccountType] = useState("PRIMARY");
  const [accountNumber, setAccountNumber] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listSavingsAccounts({ q: query, status })
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
              setError(message(failure, "Could not load savings accounts."));
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

  useEffect(() => {
    let active = true;
    void Promise.all([listClients(), listSavingsProducts()])
      .then(([clientResult, productResult]) => {
        if (!active) return;
        setClients(clientResult.items);
        setProducts(productResult.items);
        const params = new URLSearchParams(window.location.search);
        const requestedClientId = params.get("clientId");
        if (requestedClientId && clientResult.items.some((client) => client.id === requestedClientId)) {
          setClientId(requestedClientId);
          if (params.get("open") === "1") setModalOpen(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaved(null);
    if (!clientId) {
      setSaveError("Client is required.");
      return;
    }
    setSaving(true);
    try {
      await createSavingsAccount({
        clientId,
        productId: productId || null,
        accountType,
        accountNumber: accountNumber.trim() || undefined,
      });
      pushToast("Savings account created.");
      setSaved("Created.");
      setModalOpen(false);
      setClientId("");
      setProductId("");
      setAccountType("PRIMARY");
      setAccountNumber("");
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setSaveError(message(failure, "Could not create this savings account."));
    } finally {
      setSaving(false);
    }
  }

  const items = useMemo(() => (data?.items ?? []).filter((item) => {
    if (productIdFilter && !products.some((product) => product.id === productIdFilter && (product.name === item.productName || product.code === item.productCode))) return false;
    return extraFilterFields.every((field) => {
      const value = extraFilters[field].trim().toLocaleLowerCase();
      if (!value) return true;
      const fieldValue = field === "accountNumber" ? item.accountNumber
        : field === "memberId" ? item.clientReference ?? ""
        : field === "memberName" ? item.clientName ?? ""
        : item.accountType;
      return fieldValue.toLocaleLowerCase().includes(value);
    });
  }), [data, productIdFilter, products, extraFilterFields, extraFilters]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstItem = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, items.length);
  const hasFilters = Boolean(query.trim() || status || productIdFilter || Object.values(extraFilters).some((value) => value.trim()));

  function openFieldFilter(key: ExtraFilterKey) {
    setExtraFilterDraft(extraFilters[key]);
    setFilterPopover(key);
  }

  function applyFieldFilter(key: ExtraFilterKey) {
    setExtraFilters((current) => ({ ...current, [key]: extraFilterDraft }));
    setPage(1);
    setFilterPopover(null);
  }

  return (
    <div className="space-y-[15px]">
      <PageHeader
        variant="card"
        icon={<Wallet className="size-[19.33px] shrink-0 text-primary" aria-hidden="true" />}
        title="Savings"
        className="min-h-[69.33px] px-[19.33px] py-0 sm:pl-[20.67px] sm:pr-[19.33px] [&>div:first-child]:gap-[10.67px] [&_h1]:!font-semibold [&_h2]:!font-semibold"
        actions={data?.canCreate ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="!h-[29px] !w-[97px] !gap-[4px] !rounded-[6px] !border-primary !bg-transparent !px-[8.4px] !text-[11.76px] !font-medium !text-primary"
          >
            <Plus aria-hidden="true" className="size-[14px]" />
            New saving
          </Button>
        ) : null}
      />

      <section className="rounded-t-[var(--card-radius)] border border-card-border bg-surface px-[10.67px] py-[11.33px]">
        <div className="flex flex-col gap-[7.33px] sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[191px] sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="savings-account-search"
              aria-label="Search savings accounts"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Search"
              className="!h-[34.13px] !border-primary !pl-[33.6px]"
            />
          </div>
          <div className="relative shrink-0">
            <Button
              type="button"
              variant="outline"
              aria-expanded={filterPopover === "product"}
              onClick={() => { setDraftProductId(productIdFilter); setFilterPopover(filterPopover === "product" ? null : "product"); }}
              className="h-[34.93px] w-[82.7px] justify-between gap-1 !border-primary !px-2 !text-primary"
            >
              Product <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
            {filterPopover === "product" ? (
              <div role="dialog" aria-label="Filter by Product" className="absolute left-0 top-full z-30 mt-1 flex min-h-[290px] w-[350px] flex-col rounded-md border border-card-border bg-surface p-6 shadow-lg">
                <p className="mb-2 fs-text font-semibold text-strong">Product</p>
                <label className="mb-1 block fs-text text-muted-foreground" htmlFor="savings-product-condition">Condition</label>
                <select id="savings-product-condition" value="Is" disabled className="mb-3 h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text"><option>Is</option></select>
                <label className="mb-1 block fs-text text-muted-foreground" htmlFor="savings-product">Value</label>
                <select id="savings-product" value={draftProductId} onChange={(event) => setDraftProductId(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text">
                  <option value="">Select product</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                <div className="mt-auto flex justify-end gap-2 border-t border-card-border pt-3">
                  <Button type="button" variant="outline" className="!border-primary !text-primary" disabled={!productIdFilter && !draftProductId} onClick={() => { setDraftProductId(""); setProductIdFilter(""); setPage(1); setFilterPopover(null); }}>Clear</Button>
                  <Button type="button" className="disabled:!border-card-border disabled:!bg-subtle disabled:!text-muted-foreground disabled:!opacity-100" disabled={draftProductId === productIdFilter} onClick={() => { setProductIdFilter(draftProductId); setPage(1); setFilterPopover(null); }}>Apply</Button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="relative shrink-0">
            <Button
              type="button"
              variant="outline"
              aria-expanded={filterPopover === "status"}
              onClick={() => { setDraftStatus(status); setFilterPopover(filterPopover === "status" ? null : "status"); }}
              className="h-[34.93px] w-[75.53px] justify-between gap-1 !border-primary !px-2 !text-primary"
            >
              Status <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
            {filterPopover === "status" ? (
              <div role="dialog" aria-label="Filter by Status" className="absolute left-0 top-full z-30 mt-1 flex min-h-[290px] w-[350px] flex-col rounded-md border border-card-border bg-surface p-6 shadow-lg">
                <p className="mb-2 fs-text font-semibold text-strong">Status</p>
                <label className="mb-1 block fs-text text-muted-foreground" htmlFor="savings-status-condition">Condition</label>
                <select id="savings-status-condition" value="Is" disabled className="mb-3 h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text"><option>Is</option></select>
                <label className="mb-1 block fs-text text-muted-foreground" htmlFor="savings-status">Value</label>
                <select id="savings-status" value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text">
                  <option value="">Select status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <div className="mt-auto flex justify-end gap-2 border-t border-card-border pt-3">
                  <Button type="button" variant="outline" className="!border-primary !text-primary" disabled={!status && !draftStatus} onClick={() => { setDraftStatus(""); setStatus(""); setPage(1); setFilterPopover(null); }}>Clear</Button>
                  <Button type="button" className="disabled:!border-card-border disabled:!bg-subtle disabled:!text-muted-foreground disabled:!opacity-100" disabled={draftStatus === status} onClick={() => { setStatus(draftStatus); setPage(1); setFilterPopover(null); }}>Apply</Button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="relative shrink-0">
            <Button
              type="button"
              variant="outline"
              aria-expanded={filterMenuOpen}
              aria-controls="savings-extra-filters"
              className="h-[34.13px] w-[131.33px] justify-between !border-primary !text-primary"
              onClick={() => setFilterMenuOpen((open) => !open)}
            >
              <span className="inline-flex items-center gap-2"><Plus aria-hidden="true" />Add Filters</span>
              <ChevronDown aria-hidden="true" />
            </Button>
            {filterMenuOpen ? (
              <div id="savings-extra-filters" role="group" aria-label="Additional savings filters" className="absolute left-0 top-full z-30 mt-1 w-64 rounded-md border border-card-border bg-surface p-2 shadow-lg">
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
                    <label className="mb-1 block fs-text text-muted-foreground" htmlFor={`savings-condition-${key}`}>Condition</label>
                    <select id={`savings-condition-${key}`} value="Contains" disabled className="mb-3 h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-card-border bg-background px-3 fs-text"><option>Contains</option></select>
                    <label className="mb-1 block fs-text text-muted-foreground" htmlFor={`savings-value-${key}`}>Value</label>
                    <Input id={`savings-value-${key}`} placeholder={`Enter ${label.toLocaleLowerCase()}`} value={extraFilterDraft} onChange={(event) => setExtraFilterDraft(event.target.value)} className="h-[var(--control-height)]" />
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
        <ForbiddenPanel message="Your role cannot view savings accounts. Ask an administrator for Savings Account : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : (
        <section className="-mt-[18px] overflow-hidden rounded-b-[var(--card-radius)] border border-t-0 border-card-border bg-card">
          <div className="table-scroll overflow-x-auto">
            <table className="w-full text-left fs-text">
              <thead className="border-b border-card-border bg-[#f8fafc] fs-text font-bold tracking-wide text-[#495057]">
                <tr>
                  <th hidden={!visibleColumns.accountNumber} className="!h-[37px] whitespace-nowrap !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Account Number</th>
                  <th hidden={!visibleColumns.memberId} className="!h-[37px] whitespace-nowrap !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Member ID</th>
                  <th hidden={!visibleColumns.memberName} className="!h-[37px] whitespace-nowrap !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Member Name</th>
                  <th hidden={!visibleColumns.product} className="!h-[37px] whitespace-nowrap !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Product</th>
                  <th hidden={!visibleColumns.type} className="!h-[37px] whitespace-nowrap !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Type</th>
                  <th hidden={!visibleColumns.creationDate} className="!h-[37px] whitespace-nowrap !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Creation Date</th>
                  <th hidden={!visibleColumns.status} className="!h-[37px] whitespace-nowrap !px-[13.44px] !py-[10.08px] !font-bold !text-[#495057]">Status</th>
                  <th scope="col" aria-label="Column settings" className="sticky right-0 z-10 !h-[37px] !w-[37px] !min-w-[37px] bg-[#f8fafc] !px-0 !py-[10.08px] !text-center"><ColumnPicker columns={savingsColumns} visible={visibleColumns} onToggle={(key, checked) => setVisibleColumns((current) => ({ ...current, [key]: checked }))} onReset={() => setVisibleColumns(savingsColumnDefaults)} /></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item: SavingsAccount) => (
                  <tr key={item.id} className="!h-[57.77px] border-b border-card-border last:border-0">
                    <td hidden={!visibleColumns.accountNumber} className="whitespace-nowrap !h-[57.77px] px-[13.44px] !py-0 font-normal text-body">{item.accountNumber}</td>
                    <td hidden={!visibleColumns.memberId} className="whitespace-nowrap !h-[57.77px] px-[13.44px] !py-0 text-body">{item.clientReference ?? "N/A"}</td>
                    <td hidden={!visibleColumns.memberName} className="whitespace-nowrap !h-[57.77px] px-[13.44px] !py-0 text-body">{item.clientName ?? "N/A"}</td>
                    <td hidden={!visibleColumns.product} className="whitespace-nowrap !h-[57.77px] px-[13.44px] !py-0 text-body">{item.productName ?? "N/A"}</td>
                    <td hidden={!visibleColumns.type} className="whitespace-nowrap !h-[57.77px] px-[13.44px] !py-0 text-body">{titleCase(item.accountType)}</td>
                    <td hidden={!visibleColumns.creationDate} className="whitespace-nowrap !h-[57.77px] px-[13.44px] !py-0 text-body">{new Date(item.createdAt).toLocaleDateString("en-GB").replaceAll("/", "-")}</td>
                    <td hidden={!visibleColumns.status} className="whitespace-nowrap !h-[57.77px] px-[13.44px] !py-0">
                      <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td className="sticky right-0 z-[1] whitespace-nowrap !h-[57.77px] bg-[#f8f9fa] px-3 !py-0">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          label={item.accountNumber}
                          actions={
                            data?.canEdit
                              ? [
                                  {
                                    label: item.status === "ACTIVE" ? "Deactivate" : "Activate",
                                    icon: item.status === "ACTIVE" ? UserX : UserCheck,
                                    onSelect: async () => {
                                      const next = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                                      await updateSavingsAccount(item.id, { status: next });
                                      pushToast(`Savings account ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
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
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="h-[168px] px-[13.44px] text-center"><div className="flex flex-col items-center justify-center gap-2 text-[#6c757d]"><Inbox className="size-[40px]" aria-hidden="true" /><p className="fs-text">No data available</p></div></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-card-border px-3 py-2 fs-text text-muted-foreground">
            <span aria-live="polite">Showing {firstItem} to {lastItem} of {items.length} entries</span>
            <nav aria-label="Savings account list pages" className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon-xs" aria-label="First page" disabled={currentPage === 1} onClick={() => setPage(1)}><ChevronsLeft aria-hidden="true" /></Button>
              <Button type="button" variant="ghost" size="icon-xs" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft aria-hidden="true" /></Button>
              <span aria-current="page" className="grid size-10 place-items-center rounded-full bg-primary-tint text-primary">{currentPage}</span>
              <Button type="button" variant="ghost" size="icon-xs" aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ChevronRight aria-hidden="true" /></Button>
              <Button type="button" variant="ghost" size="icon-xs" aria-label="Last page" disabled={currentPage >= pageCount} onClick={() => setPage(pageCount)}><ChevronsRight aria-hidden="true" /></Button>
            </nav>
            <label className="sr-only" htmlFor="savings-page-size">Rows per page</label>
            <div className="w-[80px] shrink-0">
              <select id="savings-page-size" aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
          </div>
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Details">
        <form className="space-y-5" onSubmit={(event) => void save(event)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="sa-client">
              Client/Member
              </label>
              <select
                id="sa-client"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName} ({client.referenceNo})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="sa-product">
                Product
              </label>
              <select
                id="sa-product"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
              >
                <option value="">Primary (no product)</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="sa-type">
                Account type
              </label>
              <Input id="sa-type" value={accountType} onChange={(event) => setAccountType(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="sa-number">
                Account number
              </label>
              <Input id="sa-number" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} placeholder="Auto-generated if blank" className="h-[var(--control-height)]" />
            </div>
          </div>

          <FormError message={saveError} />
          <SuccessNote message={saved} />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
