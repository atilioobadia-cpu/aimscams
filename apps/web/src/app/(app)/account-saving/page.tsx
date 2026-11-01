"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FilterX, Plus, Save, Search, UserCheck, UserX, Wallet, X } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, FormError, SuccessNote } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { listClients, listSavingsAccounts, listSavingsProducts, createSavingsAccount, updateSavingsAccount, type Client, type SavingsAccount } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

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
  const [filterPopover, setFilterPopover] = useState<"product" | "status" | null>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [extraFilterFields, setExtraFilterFields] = useState<string[]>([]);
  const [extraFilters, setExtraFilters] = useState({ accountNumber: "", memberId: "", memberName: "", type: "" });
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

  const items = (data?.items ?? []).filter((item) => {
    if (productIdFilter && !products.some((product) => product.id === productIdFilter && (product.name === item.productName || product.code === item.productCode))) return false;
    return extraFilterFields.every((field) => {
      const value = extraFilters[field as keyof typeof extraFilters].trim().toLocaleLowerCase();
      if (!value) return true;
      const fieldValue = field === "accountNumber" ? item.accountNumber
        : field === "memberId" ? item.clientReference ?? ""
        : field === "memberName" ? item.clientName ?? ""
        : item.accountType;
      return fieldValue.toLocaleLowerCase().includes(value);
    });
  });
  const hasFilters = Boolean(query.trim() || status || productIdFilter || Object.values(extraFilters).some((value) => value.trim()));

  return (
    <div className="space-y-5">
      <PageHeader
        variant="card"
        title="Savings"
        icon={<Wallet className="size-6 shrink-0 text-primary" aria-hidden="true" />}
        actions={data?.canCreate ? (
          <Button
            onClick={() => setModalOpen(true)}
            variant="outline"
            className="h-[var(--control-height)] border-primary px-[var(--space-16)] fs-text font-semibold text-primary hover:bg-primary/5"
          >
            <Plus className="size-4" aria-hidden="true" />
            New saving
          </Button>
        ) : null}
      />

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[240px] sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="savings-account-search" aria-label="Search savings accounts" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-[var(--control-height)] pl-9" />
          </div>
          {(["product", "status"] as const).map((field) => {
            const label = field === "product" ? "Product" : "Status";
            const open = filterPopover === field;
            return (
              <div key={field} className="relative w-full sm:w-[150px]">
                <Button type="button" variant="outline" aria-label={`Filter by ${label}`} aria-expanded={open} className="w-full justify-between !border-primary !text-primary" onClick={() => { setDraftProductId(productIdFilter); setDraftStatus(status); setFilterPopover(open ? null : field); }}>
                  {label}<ChevronDown aria-hidden="true" />
                </Button>
                {open ? (
                  <div role="dialog" aria-label={`${label} filter`} className="absolute left-0 top-full z-30 mt-1 w-64 rounded-md border border-card-border bg-surface p-4 shadow-lg">
                    <p className="fs-text font-semibold text-heading">{label}</p>
                    <label className="mt-3 block fs-caption text-label" htmlFor={`savings-${field}-condition`}>Condition</label>
                    <select id={`savings-${field}-condition`} aria-label="Condition" disabled className="mt-1 h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"><option>Is</option></select>
                    <label className="mt-3 block fs-caption text-label" htmlFor={`savings-${field}-value`}>Value</label>
                    <select id={`savings-${field}-value`} aria-label={`${label} value`} value={field === "product" ? draftProductId : draftStatus} onChange={(event) => field === "product" ? setDraftProductId(event.target.value) : setDraftStatus(event.target.value)} className="mt-1 h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text">
                      <option value="">Select {label.toLocaleLowerCase()}</option>
                      {field === "product" ? products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>) : <><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="CLOSED">Closed</option></>}
                    </select>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => { if (field === "product") { setProductIdFilter(""); setDraftProductId(""); } else { setStatus(""); setDraftStatus(""); } setFilterPopover(null); }}>Clear</Button>
                      <Button type="button" variant="outline" className="!border-primary !text-primary" onClick={() => { if (field === "product") setProductIdFilter(draftProductId); else setStatus(draftStatus); setFilterPopover(null); }}>Apply</Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
          <div className="relative w-full sm:w-[150px]">
            <Button type="button" variant="outline" aria-label="Add filters" aria-expanded={filterMenuOpen} className="w-full justify-between !border-primary !text-primary" onClick={() => setFilterMenuOpen((value) => !value)}><span>{extraFilterFields.length ? `${extraFilterFields.length} added` : "Add Filters"}</span><ChevronDown aria-hidden="true" /></Button>
            {filterMenuOpen ? <div role="group" aria-label="Additional savings filters" className="absolute left-0 top-full z-30 mt-1 w-56 rounded-md border border-card-border bg-surface p-2 shadow-lg">{[{ key: "accountNumber", label: "Account Number" }, { key: "memberId", label: "Member ID" }, { key: "memberName", label: "Member Name" }, { key: "type", label: "Type" }].map(({ key, label }) => <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 fs-text hover:bg-subtle"><input type="checkbox" checked={extraFilterFields.includes(key)} onChange={(event) => { setExtraFilterFields((current) => event.target.checked ? [...current, key] : current.filter((field) => field !== key)); if (!event.target.checked) setExtraFilters((current) => ({ ...current, [key]: "" })); }} />{label}</label>)}</div> : null}
          </div>
          <Button type="button" variant="outline" size="icon-lg" aria-label="Save current filters" className="!size-[36px] !border-primary !text-primary" onClick={() => pushToast("Saved filters are not available for this installation yet.")}><Save aria-hidden="true" /></Button>
          <Button type="button" variant="outline" size="icon-lg" aria-label="Clear filters" className="!size-[36px] !border-primary !text-primary" onClick={() => { setQuery(""); setStatus(""); setProductIdFilter(""); setDraftStatus(""); setDraftProductId(""); setExtraFilterFields([]); setExtraFilters({ accountNumber: "", memberId: "", memberName: "", type: "" }); setFilterMenuOpen(false); setFilterPopover(null); }}><FilterX aria-hidden="true" /></Button>
        </div>
        {extraFilterFields.length ? <div className="mt-3 flex flex-wrap gap-2">{extraFilterFields.map((field) => { const label = field === "accountNumber" ? "Account Number" : field === "memberId" ? "Member ID" : field === "memberName" ? "Member Name" : "Type"; return <div key={field} className="flex w-full sm:w-[230px]"><Input aria-label={label} placeholder={label} value={extraFilters[field as keyof typeof extraFilters]} onChange={(event) => setExtraFilters((current) => ({ ...current, [field]: event.target.value }))} className="h-[var(--control-height)] rounded-r-none" /><Button type="button" variant="outline" size="icon-lg" aria-label={`Remove ${label} filter`} className="!size-[42px] !rounded-l-none !border-primary !border-l-0 !text-primary" onClick={() => { setExtraFilterFields((current) => current.filter((item) => item !== field)); setExtraFilters((current) => ({ ...current, [field]: "" })); }}><X aria-hidden="true" /></Button></div>; })}</div> : null}
      </div>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view savings accounts. Ask an administrator for Savings Account : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">Account number</th>
                  <th className="px-4 py-3">Member ID</th>
                  <th className="px-4 py-3">Member name</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Creation date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center fs-text text-muted-foreground">
                      {hasFilters ? "No savings account matches. Adjust or clear the filters." : "No savings accounts yet. Create a savings account to get started."}
                    </td>
                  </tr>
                ) : items.map((item: SavingsAccount) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="px-4 py-3 font-medium text-strong">{item.accountNumber}</td>
                    <td className="px-4 py-3 text-body">{item.clientReference ?? "N/A"}</td>
                    <td className="px-4 py-3 text-body">{item.clientName ?? "N/A"}</td>
                    <td className="px-4 py-3 text-body">{item.productName ?? "N/A"}</td>
                    <td className="px-4 py-3 text-body">{item.accountType}</td>
                    <td className="px-4 py-3 text-body">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
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
              </tbody>
            </table>
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
