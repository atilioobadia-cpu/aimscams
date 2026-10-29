"use client";

import { useEffect, useState } from "react";
import { CreditCard, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const items = transactions?.items ?? [];

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Online collections" description="Initiate an online transaction and capture the provider reference." />
        <ForbiddenPanel message="Your role cannot view online collections. Ask an administrator for Transaction : Create." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Online collections"
        description="Initiate an online transaction, choose the provider and capture the reference."
        breadcrumb="Transactions"
      />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <h2 className="mb-3 fs-text font-bold text-strong">New online collection</h2>
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
          <Button type="submit" disabled={submitting || !amount}>{submitting ? "Recording..." : "Record collection"}</Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="fs-text font-bold text-strong">Recent online collections</h2>
        {loading ? (
          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
            <PanelSkeleton rows={6} />
          </section>
        ) : items.length === 0 ? (
          <EmptyState icon={CreditCard} title="No online collections yet" description="Recorded online collections will appear here." />
        ) : (
          <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left fs-text">
                <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3">Reference</th>
                    <th className="whitespace-nowrap px-4 py-3">Type</th>
                    <th className="whitespace-nowrap px-4 py-3">Amount</th>
                    <th className="whitespace-nowrap px-4 py-3">Status</th>
                    <th className="whitespace-nowrap px-4 py-3">Accounting</th>
                    <th className="whitespace-nowrap px-4 py-3">Client</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-card-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.transactionNo}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(item.type.replace(/_/g, " "))}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(item.amountMinor)}</td>
                      <td className="whitespace-nowrap px-4 py-3"><Badge variant={item.status === "APPROVED" ? "default" : "outline"}>{titleCase(item.status)}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3"><Badge variant={item.accountingStatus === "POSTED" ? "default" : "outline"}>{titleCase(item.accountingStatus)}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3 text-body">{item.clientName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
