"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightLeft, CalendarDays, CreditCard, Plus, RotateCcw, Save, Search, SlidersHorizontal } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import { createTransaction, listTransactions, type TransactionList } from "@/lib/transactions";

const PROVIDERS = ["MPESA", "TIGOPESA", "AIRTELMONEY", "HALOPESA", "BANK_TRANSFER", "OTHER"];

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load online collections.";
}

export function OnlineCollectionsPage() {
  const [transactions, setTransactions] = useState<TransactionList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [provider, setProvider] = useState("MPESA");
  const [externalRef, setExternalRef] = useState("");
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState("");
  const [savingsAccountId, setSavingsAccountId] = useState("");
  const [narration, setNarration] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("MNO");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listTransactions({ q: "online", page: 1, pageSize: 20 })
        .then((next) => {
          if (cancelled) return;
          setTransactions(next);
          setForbidden(false);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) {
            setForbidden(true);
            setTransactions(null);
          } else {
            setError(failureMessage(failure));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reloadKey]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const result = await createTransaction({
        type: "SAVINGS_DEPOSIT",
        amountMinor: amount,
        clientId: clientId || undefined,
        savingsAccountId: savingsAccountId || undefined,
        paymentMethod,
        provider,
        externalRef: externalRef || undefined,
        narration: narration || `Online collection via ${provider}`,
      });
      setSubmitSuccess(`Recorded online collection ${result.transactionNo} (${result.accountingStatus}).`);
      setAmount("");
      setExternalRef("");
      setNarration("");
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setSubmitError(failureMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  const visibleItems = useMemo(() => (transactions?.items ?? []).filter((item) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery = !normalizedQuery || [item.clientName, item.accountNumber, item.receiptNo, item.externalRef]
      .some((value) => value?.toLowerCase().includes(normalizedQuery));
    const timestamp = Date.parse(item.createdAt);
    const date = Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : "";
    return matchesQuery && (status === "ALL" || item.status === status) && (!from || date >= from) && (!to || date <= to);
  }), [transactions?.items, from, query, status, to]);

  function saveFilters() {
    window.localStorage.setItem("aimscams-online-transaction-filters", JSON.stringify({ query, status, from, to }));
  }

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Online Transactions" variant="card" icon={<CreditCard className="size-5 text-primary" aria-hidden="true" />} />
        <ForbiddenPanel message="Your role cannot view online collections. Ask an administrator for Transaction : Create." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Online Transactions"
        variant="card"
        icon={<CreditCard className="size-5 text-primary" aria-hidden="true" />}
        actions={(
          <>
            <Button type="button" variant="outline" size="sm" className="h-[29px] rounded-[6px] border-primary px-[8.4px] fs-caption font-medium text-primary hover:bg-subtle" onClick={() => setFormOpen(true)}>
              <Plus className="size-3" aria-hidden="true" /> Initiate Online Transaction
            </Button>
            <Button asChild variant="outline" size="sm" className="h-[29px] rounded-[6px] border-primary px-[8.4px] fs-caption font-medium text-primary hover:bg-subtle">
              <Link href="/transaction-online-payment-reconciliation"><ArrowRightLeft className="size-3" aria-hidden="true" /> Online Transaction Reconciliation</Link>
            </Button>
          </>
        )}
      />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section aria-label="Online transaction filters" className="grid grid-cols-1 gap-2 rounded-[var(--card-radius)] border border-card-border bg-surface p-3 md:grid-cols-[minmax(190px,1fr)_190px_120px_120px_30px_30px]">
        <div className="relative min-w-[190px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Search online transactions" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-[35px] rounded-[6px] border-primary pl-8 fs-text" />
        </div>
        <select aria-label="Payment Transaction Status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-[35px] min-w-[190px] rounded-[6px] border border-primary bg-background px-2 fs-caption text-body">
          <option value="ALL">Payment Transaction Status</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REVERSED">Reversed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <label className="sr-only" htmlFor="online-from">Start Date</label>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-primary" aria-hidden="true" />
          <Input id="online-from" aria-label="Start Date" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-[35px] w-[120px] rounded-[6px] border-primary pl-7 fs-caption" />
        </div>
        <label className="sr-only" htmlFor="online-to">End Date</label>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-primary" aria-hidden="true" />
          <Input id="online-to" aria-label="End Date" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-[35px] w-[120px] rounded-[6px] border-primary pl-7 fs-caption" />
        </div>
        <Button type="button" variant="outline" size="icon-sm" aria-label="Save filters" title="Save filters" onClick={saveFilters} className="h-[29px] w-[30px] rounded-[6px] border-primary text-primary hover:bg-subtle">
          <Save className="size-3.5" aria-hidden="true" />
        </Button>
        <Button type="button" variant="outline" size="icon-sm" aria-label="Clear filters" title="Clear filters" onClick={() => { setQuery(""); setStatus("ALL"); setFrom(""); setTo(""); }} className="h-[29px] w-[30px] rounded-[6px] border-primary text-primary hover:bg-subtle">
          <RotateCcw className="size-3.5" aria-hidden="true" />
        </Button>
      </section>

      <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
        {loading ? <PanelSkeleton rows={6} /> : null}
        {!loading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-bold text-label">
                <tr>
                  <th className="whitespace-nowrap border-b border-card-border px-[13.44px] py-[10.08px]">Creation Date</th>
                  <th className="whitespace-nowrap border-b border-card-border px-[13.44px] py-[10.08px]">Client Name</th>
                  <th className="whitespace-nowrap border-b border-card-border px-[13.44px] py-[10.08px]">Account Number</th>
                  <th className="whitespace-nowrap border-b border-card-border px-[13.44px] py-[10.08px]">Transaction Reference ID</th>
                  <th className="whitespace-nowrap border-b border-card-border px-[13.44px] py-[10.08px]">External Id</th>
                  <th className="whitespace-nowrap border-b border-card-border px-[13.44px] py-[10.08px]">Payment Provider</th>
                  <th className="whitespace-nowrap border-b border-card-border px-[13.44px] py-[10.08px]">Transaction Type</th>
                  <th className="whitespace-nowrap border-b border-card-border px-[13.44px] py-[10.08px]">Status</th>
                  <th className="whitespace-nowrap border-b border-card-border px-[13.44px] py-[10.08px]">Reconciled</th>
                  <th className="whitespace-nowrap border-b border-card-border px-[13.44px] py-[10.08px]">Amount (TSh)</th>
                  <th className="w-10 px-2 py-2 text-center"><Button type="button" variant="ghost" size="icon-sm" disabled aria-label="Table columns" className="disabled:opacity-100 disabled:text-primary"><SlidersHorizontal className="size-3.5" aria-hidden="true" /></Button></th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.length === 0 ? (
                  <tr><td colSpan={11} className="h-[140px] text-center text-muted-foreground">No data available</td></tr>
                ) : visibleItems.map((item) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0 hover:bg-subtle/50">
                    <td className="whitespace-nowrap px-[13.44px] py-2.5 text-body">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-[13.44px] py-2.5 text-body">{item.clientName || "—"}</td>
                    <td className="whitespace-nowrap px-[13.44px] py-2.5 text-body">{item.accountNumber || "—"}</td>
                    <td className="whitespace-nowrap px-[13.44px] py-2.5 text-body">{item.receiptNo || item.transactionNo || "—"}</td>
                    <td className="whitespace-nowrap px-[13.44px] py-2.5 text-body">{item.externalRef || "—"}</td>
                    <td className="whitespace-nowrap px-[13.44px] py-2.5 text-body">—</td>
                    <td className="whitespace-nowrap px-[13.44px] py-2.5 text-body">{titleCase(item.type.replace(/_/g, " "))}</td>
                    <td className="whitespace-nowrap px-[13.44px] py-2.5"><Badge variant={item.status === "APPROVED" ? "default" : "outline"}>{titleCase(item.status)}</Badge></td>
                    <td className="whitespace-nowrap px-[13.44px] py-2.5 text-body">—</td>
                    <td className="whitespace-nowrap px-[13.44px] py-2.5 tabular-nums text-body">{formatTzs(item.amountMinor)}</td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Initiate Online Transaction" size="large" unsaved>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="provider">Provider</label>
              <select id="provider" value={provider} onChange={(event) => setProvider(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
                {PROVIDERS.map((item) => (
                  <option key={item} value={item}>{titleCase(item.replace(/_/g, " "))}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="payment-method">Payment method</label>
              <select id="payment-method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
                <option value="MNO">Mobile money</option>
                <option value="BANK">Bank</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="external-ref">Provider reference</label>
              <Input id="external-ref" value={externalRef} onChange={(event) => setExternalRef(event.target.value)} placeholder="Provider transaction ID" className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="online-amount">Amount (minor units)</label>
              <Input id="online-amount" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="online-client">Client ID</label>
              <Input id="online-client" value={clientId} onChange={(event) => setClientId(event.target.value)} placeholder="Optional" className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="online-savings">Savings account ID</label>
              <Input id="online-savings" value={savingsAccountId} onChange={(event) => setSavingsAccountId(event.target.value)} placeholder="Optional" className="h-[var(--control-height)]" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="online-narration">Narration</label>
              <Input id="online-narration" value={narration} onChange={(event) => setNarration(event.target.value)} placeholder="Optional" className="h-[var(--control-height)]" />
            </div>
          </div>
          {submitError ? <p className="fs-text text-accent-red" role="alert">{submitError}</p> : null}
          {submitSuccess ? <p className="fs-text text-accent-teal" role="status">{submitSuccess}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || !amount}>{submitting ? "Recording..." : "Record collection"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
