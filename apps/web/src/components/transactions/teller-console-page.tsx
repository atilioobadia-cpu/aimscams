"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel } from "@/components/accounting/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TellerWorkspaceHeader } from "@/components/transactions/teller-workspace-header";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import {
  createTransaction,
  getTill,
  type TillInfo,
} from "@/lib/transactions";

const TELLER_CATEGORIES = [
  { key: "client", label: "Client Transaction", description: "Record transactions related to an individual client.", types: ["SAVINGS_DEPOSIT", "SAVINGS_WITHDRAWAL", "SHARES_DEPOSIT", "SHARES_WITHDRAWAL", "LOAN_REPAYMENT", "LOAN_DISBURSEMENT", "LOAN_APPLICATION_FEE", "FEE_PENALTY_APPLY", "FEE_PENALTY_REVERSE", "ERROR_CORRECTION"] },
  { key: "ledger", label: "General Ledger", description: "Record internal entries such as expenses or journal postings.", types: ["GL_RECEIPT", "GL_PAYMENT", "OTHER_INCOME", "RECORD_EXPENSE", "PAY_CORPORATE_TAX", "CONTRA"] },
  { key: "till", label: "Till Administration", description: "Manage teller till operations like open, close, and transfer.", types: ["TILL_OPENING", "TILL_BALANCE", "TILL_TRANSFER"] },
  { key: "bulk", label: "Bulk Transaction", description: "Process multiple client transactions in a single operation.", types: ["BULK_DEPOSIT", "BULK_LOAN_DISBURSEMENT"] },
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
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [type, setType] = useState("");
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
      setError(null);
      void getTill()
        .then((tillInfo) => {
          if (cancelled) return;
          setTill(tillInfo);
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

  const isOpen = till?.session?.status === "OPEN";
  const selectedCategoryDetails = TELLER_CATEGORIES.find((category) => category.key === selectedCategory);
  const requiresClient = selectedCategory === "client";
  const requiresSavingsAccount = type === "SAVINGS_DEPOSIT" || type === "SAVINGS_WITHDRAWAL";
  const requiresLoan = type.startsWith("LOAN_");
  const requiresLedgerAccount = selectedCategory === "ledger";

  if (forbidden) {
    return (
      <div className="space-y-5">
        <TellerWorkspaceHeader till={till} activeTab="new" />
        <ForbiddenPanel message="Your role cannot use the teller console. Ask an administrator for Transaction : Create." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TellerWorkspaceHeader till={till} activeTab="new" />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="mb-5 flex items-center gap-2 fs-caption font-semibold text-muted-foreground" aria-label={`Step ${selectedCategory ? type ? 3 : 2 : 1} of 3`}>
          {[1, 2, 3].map((step) => {
            const currentStep = selectedCategory ? (type ? 3 : 2) : 1;
            return <span key={step} className={`grid size-6 place-items-center rounded-full ${step === currentStep ? "bg-primary text-primary-foreground" : "bg-subtle text-muted-foreground"}`}>{step}</span>;
          })}
          <span className="ml-1">Step {selectedCategory ? (type ? 3 : 2) : 1} of 3</span>
        </div>

        {!selectedCategoryDetails ? (
          <>
            <h2 className="mb-4 fs-text font-bold text-strong">Choose Category</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {TELLER_CATEGORIES.map((category) => (
                <button key={category.key} type="button" onClick={() => { setSelectedCategory(category.key); setType(""); }} className="min-h-[112px] rounded-[var(--card-radius)] border border-card-border bg-surface p-4 text-left transition-colors hover:border-primary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <span className="mb-3 grid size-8 place-items-center rounded-full bg-primary/10 text-primary"><ArrowLeftRight className="size-4" aria-hidden="true" /></span>
                  <span className="block fs-text font-semibold text-strong">{category.label}</span>
                  <span className="mt-1 block fs-caption text-muted-foreground">{category.description}</span>
                </button>
              ))}
            </div>
          </>
        ) : !type ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="fs-caption text-muted-foreground">{selectedCategoryDetails.label}</p>
                <h2 className="fs-text font-bold text-strong">Choose Type</h2>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCategory(null)}>Back</Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {selectedCategoryDetails.types.map((item) => (
                <button key={item} type="button" onClick={() => setType(item)} className="min-h-[76px] rounded-[var(--card-radius)] border border-card-border bg-surface p-4 text-left transition-colors hover:border-primary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <span className="block fs-text font-semibold text-strong">{TYPE_LABELS[item]}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
        <>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="fs-caption text-muted-foreground">{selectedCategoryDetails.label}</p>
            <h2 className="fs-text font-bold text-strong">{TYPE_LABELS[type]}</h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setType("")}>Back</Button>
        </div>
        {selectedCategory === "till" ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--card-radius)] border border-card-border bg-subtle p-3">
            <div>
              <p className="fs-text font-semibold text-strong">Till status: {isOpen ? "Open" : "Closed"}</p>
              <p className="fs-caption text-muted-foreground">{till?.businessDate ?? "Today"} · Cash in {formatTzs(till?.cashInMinor ?? "0")} · Cash out {formatTzs(till?.cashOutMinor ?? "0")}</p>
              {isOpen ? <p className="fs-caption text-muted-foreground">System balance {formatTzs(till?.session?.systemBalanceMinor ?? "0")}</p> : null}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              {!isOpen ? (
                <>
                  <div><label className="mb-1 block fs-caption font-medium text-body" htmlFor="open-float">Opening float (minor units)</label><Input id="open-float" value={openFloat} onChange={(event) => setOpenFloat(event.target.value)} placeholder="0" className="h-[var(--control-height)] w-[180px]" /></div>
                  <Button type="button" onClick={handleOpenTill} disabled={!openFloat}>Open till</Button>
                </>
              ) : (
                <>
                  <div><label className="mb-1 block fs-caption font-medium text-body" htmlFor="counted-cash">Counted cash (minor units)</label><Input id="counted-cash" value={countedCash} onChange={(event) => setCountedCash(event.target.value)} placeholder="0" className="h-[var(--control-height)] w-[180px]" /></div>
                  <Button type="button" variant="outline" onClick={handleCloseTill} disabled={!countedCash}>Close till</Button>
                </>
              )}
            </div>
            {tillActionError ? <p className="w-full fs-text text-accent-red" role="alert">{tillActionError}</p> : null}
            {till?.session?.status === "CLOSED" && till.session.varianceMinor && till.session.varianceMinor !== "0" ? <p className="w-full fs-text text-accent-yellow" role="status">Variance {formatTzs(till.session.varianceMinor)} recorded as a pending request.</p> : null}
          </div>
        ) : null}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block fs-caption font-medium text-body" htmlFor="transaction-type-display">Transaction type</label>
              <Input id="transaction-type-display" value={TYPE_LABELS[type]} readOnly className="h-[var(--control-height)] bg-subtle" />
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
            {requiresClient ? (
              <div>
                <label className="mb-1 block fs-caption font-medium text-body" htmlFor="transaction-client">Client ID *</label>
                <Input id="transaction-client" value={clientId} onChange={(event) => setClientId(event.target.value)} placeholder="Enter client ID" className="h-[var(--control-height)]" required />
              </div>
            ) : null}
            {requiresSavingsAccount ? (
              <div>
                <label className="mb-1 block fs-caption font-medium text-body" htmlFor="transaction-savings">Search Account *</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="transaction-savings" value={savingsAccountId} onChange={(event) => setSavingsAccountId(event.target.value)} placeholder="Search..." className="h-[var(--control-height)] pl-8" required />
                </div>
              </div>
            ) : null}
            {requiresLoan ? (
              <div>
                <label className="mb-1 block fs-caption font-medium text-body" htmlFor="transaction-loan">Loan ID *</label>
                <Input id="transaction-loan" value={loanId} onChange={(event) => setLoanId(event.target.value)} placeholder="Enter loan ID" className="h-[var(--control-height)]" required />
              </div>
            ) : null}
            {requiresLedgerAccount ? (
              <div>
                <label className="mb-1 block fs-caption font-medium text-body" htmlFor="transaction-counter">Counter account code *</label>
                <Input id="transaction-counter" value={counterAccountCode} onChange={(event) => setCounterAccountCode(event.target.value)} placeholder="Search..." className="h-[var(--control-height)]" required />
              </div>
            ) : null}
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-narration">Narration</label>
              <Input id="transaction-narration" value={narration} onChange={(event) => setNarration(event.target.value)} placeholder="Optional" className="h-[var(--control-height)]" />
            </div>
          </div>
          {submitError ? <p className="fs-text text-accent-red" role="alert">{submitError}</p> : null}
          {submitSuccess ? <p className="fs-text text-accent-teal" role="status">{submitSuccess}</p> : null}
          <Button type="submit" disabled={submitting || !amount}>{submitting ? "Posting..." : "Post transaction"}</Button>
        </form>
        </>
        )}
      </section>
    </div>
  );
}
