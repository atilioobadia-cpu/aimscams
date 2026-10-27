"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, Building2, UserCheck, UserX } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, FormError, SuccessNote } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { listClients, listSavingsAccounts, listSavingsProducts, createSavingsAccount, updateSavingsAccount, type Client, type SavingsAccount, type SavingsAccountStatus } from "@/lib/settings";

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

  const items = data?.items ?? [];
  const hasFilters = Boolean(query.trim() || status);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Savings accounts" description="Savings accounts opened from eligible products." />
        {data?.canCreate ? (
          <Button onClick={() => setModalOpen(true)} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
            <Plus className="size-4" aria-hidden="true" />
            New savings account
          </Button>
        ) : null}
      </div>

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="savings-account-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="savings-account-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Account number or client"
                className="h-[var(--control-height)] pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-[220px]">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="savings-account-status">
              Status
            </label>
            <select
              id="savings-account-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view savings accounts. Ask an administrator for Savings Account : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No savings account matches" : "No savings accounts yet"}
          description={hasFilters ? "Adjust or clear the filters to see other accounts." : "Create a savings account."}
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">Account number</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: SavingsAccount) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="px-4 py-3 font-medium text-strong">{item.accountNumber}</td>
                    <td className="px-4 py-3 text-body">{item.clientName ?? "N/A"}</td>
                    <td className="px-4 py-3 text-body">{item.productName ?? "N/A"}</td>
                    <td className="px-4 py-3 text-body">{item.accountType}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-body">{item.balanceMinor}</td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New savings account" size="large">
        <form className="space-y-5" onSubmit={(event) => void save(event)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="sa-client">
                Client
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
                Savings product
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
              {saving ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
