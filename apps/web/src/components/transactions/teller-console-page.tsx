"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Clock3 } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import {
  createTransaction,
  getTill,
  listTransactions,
  type TillInfo,
  type Transaction,
  type TransactionList,
} from "@/lib/transactions";

const TELLER_CATEGORIES = [
  { label: "Client transactions", types: ["SAVINGS_DEPOSIT", "SAVINGS_WITHDRAWAL", "SHARES_DEPOSIT", "SHARES_WITHDRAWAL", "LOAN_REPAYMENT", "LOAN_DISBURSEMENT", "LOAN_APPLICATION_FEE", "FEE_PENALTY_APPLY", "FEE_PENALTY_REVERSE", "ERROR_CORRECTION"] },
  { label: "General ledger", types: ["GL_RECEIPT", "GL_PAYMENT", "OTHER_INCOME", "RECORD_EXPENSE", "PAY_CORPORATE_TAX", "CONTRA"] },
  { label: "Till administration", types: ["TILL_OPENING", "TILL_BALANCE", "TILL_TRANSFER"] },
  { label: "Bulk", types: ["BULK_DEPOSIT", "BULK_LOAN_DISBURSEMENT"] },
];

const TYPE_LABELS: Record<string, string> = {
  SAVINGS_DEPOSIT: "Savings deposit", SAVINGS_WITHDRAWAL: "Savings withdrawal",
  SHARES_DEPOSIT: "Shares deposit", SHARES_WITHDRAWAL: "Shares withdrawal",
  LOAN_REPAYMENT: "Loan repayment", LOAN_DISBURSEMENT: "Disburse loan",
  LOAN_APPLICATION_FEE: "Loan application fee", FEE_PENALTY_APPLY: "Apply fee/penalty",
  FEE_PENALTY_REVERSE: "Reverse fee/penalty", ERROR_CORRECTION: "Error correction",
  GL_RECEIPT: "Record receipt", GL_PAYMENT: "Record payment", OTHER_INCOME: "Other income",
  RECORD_EXPENSE: "Record expense", PAY_CORPORATE_TAX: "Pay corporate tax", CONTRA: "Bank/cash transfer",
  TILL_OPENING: "Till opening", TILL_BALANCE: "Till balance", TILL_TRANSFER: "Transfer",
  BULK_DEPOSIT: "Bulk deposit", BULK_LOAN_DISBURSEMENT: "Bulk loan disbursement",
};

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load the teller console.";
}

export function TellerConsolePage() {
  const [till, setTill] = useState<TillInfo | null>(null);
  const [transactions, setTransactions] = useState<TransactionList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [type, setType] = useState("SAVINGS_DEPOSIT");
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState("");
  const [savingsAccountId, setSavingsAccountId] = useState("");
  const [loanId, setLoanId] = useState("");
  const [counterAccountCode, setCounterAccountCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [narration, setNarration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [openFloat, setOpenFloat] = useState("");
  const [countedCash, setCountedCash] = useState("");
  const [tillActionError, setTillActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void Promise.all([getTill(), listTransactions({ page: 1, pageSize: 20 })])
        .then(([tillInfo, transactionList]) => {
          if (cancelled) return;
          setTill(tillInfo);
          setTransactions(transactionList);
          setForbidden(false);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) {
            setForbidden(true);
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

  async function handleOpenTill() {
    setTillActionError(null);
    try {
      const { openTill } = await import("@/lib/transactions");
      await openTill({ openingFloatMinor: openFloat });
      setOpenFloat("");
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setTillActionError(failureMessage(failure));
    }
  }

  async function handleCloseTill() {
    setTillActionError(null);
    try {
      const { closeTill } = await import("@/lib/transactions");
      await closeTill({ countedMinor: countedCash });
      setCountedCash("");
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setTillActionError(failureMessage(failure));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const result = await createTransaction({
        type,
        amountMinor: amount,
        clientId: clientId || undefined,
        savingsAccountId: savingsAccountId || undefined,
        loanId: loanId || undefined,
        counterAccountCode: counterAccountCode || undefined,
        paymentMethod,
        narration: narration || undefined,
      });
      setSubmitSuccess(`Posted transaction ${result.transactionNo} (${result.accountingStatus}).`);
      setAmount("");
      setNarration("");
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setSubmitError(failureMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  const items = transactions?.items ?? [];
  const isOpen = till?.session?.status === "OPEN";

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Teller console" description="Post client and ledger transactions from the till." breadcrumb="Transactions" />
        <ForbiddenPanel message="Your role cannot use the teller console. Ask an administrator for Transaction : Create." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Teller console" description="Post client and ledger transactions from the till." breadcrumb="Transactions" />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="fs-text font-semibold text-strong">Till status: {isOpen ? "Open" : "Closed"}</p>
            <p className="fs-text text-muted-foreground">
              {till?.businessDate ?? "Today"} · Cash in {formatTzs(till?.cashInMinor ?? "0")} · Cash out {formatTzs(till?.cashOutMinor ?? "0")}
            </p>
            {isOpen ? (
              <p className="fs-text text-muted-foreground">System balance {formatTzs(till?.session?.systemBalanceMinor ?? "0")}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            {!isOpen ? (
              <>
                <div>
                  <label className="mb-1 block fs-text font-medium text-body" htmlFor="open-float">Opening float (minor units)</label>
                  <Input id="open-float" value={openFloat} onChange={(event) => setOpenFloat(event.target.value)} placeholder="0" className="h-[var(--control-height)] w-[180px]" />
                </div>
                <Button type="button" onClick={handleOpenTill} disabled={!openFloat}>Open till</Button>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1 block fs-text font-medium text-body" htmlFor="counted-cash">Counted cash (minor units)</label>
                  <Input id="counted-cash" value={countedCash} onChange={(event) => setCountedCash(event.target.value)} placeholder="0" className="h-[var(--control-height)] w-[180px]" />
                </div>
                <Button type="button" variant="outline" onClick={handleCloseTill} disabled={!countedCash}>Close till</Button>
              </>
            )}
          </div>
        </div>
        {tillActionError ? <p className="mt-2 fs-text text-accent-red" role="alert">{tillActionError}</p> : null}
        {till?.session?.status === "CLOSED" && till.session.varianceMinor && till.session.varianceMinor !== "0" ? (
          <p className="mt-2 fs-text text-accent-yellow" role="status">Variance {formatTzs(till.session.varianceMinor)} recorded as a pending request.</p>
        ) : null}
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <h2 className="mb-3 fs-text font-bold text-strong">New transaction</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-type">Transaction type</label>
              <select id="transaction-type" value={type} onChange={(event) => setType(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
                {TELLER_CATEGORIES.map((category) => (
                  <optgroup key={category.label} label={category.label}>
                    {category.types.map((item) => (
                      <option key={item} value={item}>{TYPE_LABELS[item]}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-amount">Amount (minor units)</label>
              <Input id="transaction-amount" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" className="h-[var(--control-height)]" required />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-payment">Payment method</label>
              <select id="transaction-payment" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text">
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
                <option value="MNO">Mobile money</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-client">Client ID</label>
              <Input id="transaction-client" value={clientId} onChange={(event) => setClientId(event.target.value)} placeholder="Optional" className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-savings">Savings account ID</label>
              <Input id="transaction-savings" value={savingsAccountId} onChange={(event) => setSavingsAccountId(event.target.value)} placeholder="Optional" className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-loan">Loan ID</label>
              <Input id="transaction-loan" value={loanId} onChange={(event) => setLoanId(event.target.value)} placeholder="Optional" className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-counter">Counter account code</label>
              <Input id="transaction-counter" value={counterAccountCode} onChange={(event) => setCounterAccountCode(event.target.value)} placeholder="For GL types" className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-narration">Narration</label>
              <Input id="transaction-narration" value={narration} onChange={(event) => setNarration(event.target.value)} placeholder="Optional" className="h-[var(--control-height)]" />
            </div>
          </div>
          {submitError ? <p className="fs-text text-accent-red" role="alert">{submitError}</p> : null}
          {submitSuccess ? <p className="fs-text text-accent-teal" role="status">{submitSuccess}</p> : null}
          <Button type="submit" disabled={submitting || !amount}>{submitting ? "Posting..." : "Post transaction"}</Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="fs-text font-bold text-strong">Session transactions</h2>
        {loading ? (
          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface"><PanelSkeleton rows={6} /></section>
        ) : items.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No transactions yet" description="Posted and pending activity for this session will appear here." />
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
                  {items.map((item: Transaction) => (
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
