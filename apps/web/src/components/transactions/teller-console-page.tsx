"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  RefreshCw,
  Search,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { ErrorPanel, ForbiddenPanel } from "@/components/accounting/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TellerWorkspaceHeader } from "@/components/transactions/teller-workspace-header";
import { ApiError } from "@/lib/api";
import { formatMinorUnitsExact, formatTzs } from "@/lib/format";
import { createTransaction, getTill, type TillInfo } from "@/lib/transactions";
import { listLoans, type Loan } from "@/lib/settings";

const TELLER_CATEGORIES = [
  {
    key: "client",
    label: "Client Transaction",
    description: "Record transactions related to an individual client.",
    icon: UsersRound,
    types: [
      "SHARES_DEPOSIT",
      "SHARES_WITHDRAWAL",
      "SAVINGS_DEPOSIT",
      "SAVINGS_WITHDRAWAL",
      "LOAN_REPAYMENT",
      "LOAN_DISBURSEMENT",
      "FEE_PENALTY_APPLY",
      "FEE_PENALTY_REVERSE",
      "LOAN_APPLICATION_FEE",
      "ERROR_CORRECTION",
    ],
  },
  {
    key: "ledger",
    label: "General Ledger",
    description: "Record internal entries such as expenses or journal postings.",
    icon: CircleDollarSign,
    types: [
      "GL_RECEIPT",
      "OTHER_INCOME",
      "GL_PAYMENT",
      "RECORD_EXPENSE",
      "PAY_CORPORATE_TAX",
      "JOURNAL_ENTRY",
      "CONTRA",
      "REVERSE_GL_ENTRY",
    ],
  },
  {
    key: "till",
    label: "Till Administration",
    description: "Manage teller till operations like open, close, and transfer.",
    icon: WalletCards,
    types: ["TILL_OPENING", "TILL_CLOSING", "TILL_TOP_UP", "TELLER_PICK_UP", "TILL_BALANCE"],
  },
  {
    key: "bulk",
    label: "Bulk Transaction",
    description: "Process multiple client transactions in a single operation.",
    types: ["BULK_DEPOSIT", "BULK_LOAN_DISBURSEMENT"],
  },
];

const TYPE_LABELS: Record<string, string> = {
  SAVINGS_DEPOSIT: "Savings Deposit",
  SAVINGS_WITHDRAWAL: "Savings Withdrawal",
  SHARES_DEPOSIT: "Shares Deposit",
  SHARES_WITHDRAWAL: "Shares Withdrawal",
  LOAN_REPAYMENT: "Loan Repayment",
  LOAN_DISBURSEMENT: "Disburse Loan",
  LOAN_APPLICATION_FEE: "Loan Application Fee",
  FEE_PENALTY_APPLY: "Apply Fee / Penalty",
  FEE_PENALTY_REVERSE: "Reverse Fee/Penalty",
  ERROR_CORRECTION: "Error Correction",
  GL_RECEIPT: "Record Receipt",
  GL_PAYMENT: "Record Payment",
  OTHER_INCOME: "Other Income",
  RECORD_EXPENSE: "Record Expense",
  PAY_CORPORATE_TAX: "Pay Corporate Tax",
  JOURNAL_ENTRY: "Journal Entry",
  CONTRA: "Bank/Cash Transfer (Contra)",
  REVERSE_GL_ENTRY: "Reverse General Ledger Entry",
  TILL_OPENING: "Till Opening",
  TILL_CLOSING: "Till Closing",
  TILL_TOP_UP: "Till Top-Up",
  TELLER_PICK_UP: "Teller Pick-Up",
  TILL_BALANCE: "Till Balance",
  BULK_DEPOSIT: "Bulk Deposit",
  BULK_LOAN_DISBURSEMENT: "Bulk New Loan Disbursement",
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  SAVINGS_DEPOSIT: "Add funds to a member's savings account.",
  SAVINGS_WITHDRAWAL: "Withdraw funds from a member's savings account.",
  SHARES_DEPOSIT: "Add funds to a member's share account.",
  SHARES_WITHDRAWAL: "Withdraw funds from a member's share account.",
  LOAN_REPAYMENT: "Record a payment made towards a loan.",
  LOAN_DISBURSEMENT: "Release funds for an approved loan.",
  LOAN_APPLICATION_FEE: "Pay fees for pending loan applications.",
  FEE_PENALTY_APPLY: "Apply a fee, penalty, or application charge.",
  FEE_PENALTY_REVERSE: "Reverse a previously applied charge.",
  ERROR_CORRECTION: "Correct a previously recorded transaction.",
  GL_RECEIPT: "Record general income or cash received.",
  OTHER_INCOME: "Record income from other GL accounts.",
  GL_PAYMENT: "Record a general outgoing payment.",
  RECORD_EXPENSE: "Record a specific business expense.",
  PAY_CORPORATE_TAX: "Record a payment for corporate taxes.",
  JOURNAL_ENTRY: "For advanced, manual ledger entries.",
  CONTRA: "Transfer funds between cash and bank accounts.",
  REVERSE_GL_ENTRY: "For error correction of general ledger entries.",
  TILL_OPENING: "Open teller till with float amount.",
  TILL_CLOSING: "Close the active teller till.",
  TILL_TOP_UP: "Add cash to the teller till.",
  TELLER_PICK_UP: "Transfer cash from the teller till.",
  TILL_BALANCE: "View and manage till balances.",
  BULK_DEPOSIT: "Process multiple deposits for savings and shares.",
  BULK_LOAN_DISBURSEMENT: "Disburse multiple new loans that are ready for funding.",
};

const AVAILABLE_TYPES = new Set([
  "SAVINGS_DEPOSIT",
  "SAVINGS_WITHDRAWAL",
  "SHARES_DEPOSIT",
  "SHARES_WITHDRAWAL",
  "LOAN_REPAYMENT",
  "LOAN_DISBURSEMENT",
  "LOAN_APPLICATION_FEE",
  "FEE_PENALTY_APPLY",
  "FEE_PENALTY_REVERSE",
  "ERROR_CORRECTION",
  "GL_RECEIPT",
  "GL_PAYMENT",
  "OTHER_INCOME",
  "RECORD_EXPENSE",
  "PAY_CORPORATE_TAX",
  "JOURNAL_ENTRY",
  "CONTRA",
  "REVERSE_GL_ENTRY",
  "TILL_OPENING",
  "TILL_CLOSING",
  "TILL_BALANCE",
  "BULK_DEPOSIT",
  "BULK_LOAN_DISBURSEMENT",
]);

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
  const [categoryFocus, setCategoryFocus] = useState("client");
  const [type, setType] = useState("");
  const [openStep, setOpenStep] = useState<1 | 2 | null>(1);
  const [amount, setAmount] = useState("");
  const [loanId, setLoanId] = useState("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanQuery, setLoanQuery] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState("");
  const [cheque, setCheque] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [narration, setNarration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [openFloat, setOpenFloat] = useState("");
  const [countedCash, setCountedCash] = useState("");
  const [tillActionError, setTillActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const selectedLoan = loans.find((loan) => loan.id === loanId) ?? null;

  const feeMinor = selectedLoan
    ? (BigInt(selectedLoan.principalMinor) * BigInt(selectedLoan.productManagementFeeBp ?? 0)) / 10000n
    : 0n;
  const amountToBeDisbursedMinor = selectedLoan
    ? BigInt(selectedLoan.principalMinor) - feeMinor
    : 0n;

  const amountValid = useMemo(() => {
    const normalized = amount.replace(/,/g, "");
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return false;
    const amountMinor = BigInt(Math.round(Number(normalized) * 100));
    if (amountMinor <= 0n) return false;
    if (amountMinor > amountToBeDisbursedMinor) return false;
    if (paymentMethod === "CASH" && till?.session?.systemBalanceMinor) {
      if (amountMinor > BigInt(till.session.systemBalanceMinor)) return false;
    }
    return true;
  }, [amount, amountToBeDisbursedMinor, paymentMethod, till]);

  useEffect(() => {
    if (type !== "LOAN_DISBURSEMENT") return;
    let cancelled = false;
    void listLoans({ status: "APPROVED" })
      .then((response) => {
        if (!cancelled) setLoans(response.items);
      })
      .catch(() => {
        if (!cancelled) setLoans([]);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

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
        amountMinor: String(Math.round(Number(amount.replace(/,/g, "")) * 100)),
        loanId: loanId || undefined,
        paymentMethod,
        valueDate: transactionDate,
        narration: narration || undefined,
        reference,
        receiptNo: receipt,
        chequeNo: cheque,
      });
      setSubmitSuccess(`Posted transaction ${result.transactionNo} (${result.accountingStatus}).`);
      setLoanId("");
      setLoanQuery("");
      setAmount("");
      setNarration("");
      setReference("");
      setReceipt("");
      setCheque("");
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setSubmitError(failureMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  const isOpen = till?.session?.status === "OPEN";
  const selectedCategoryDetails = TELLER_CATEGORIES.find((category) => category.key === selectedCategory);
  const requiresLoan = type.startsWith("LOAN_");

  function clearTransactionDetails() {
    setAmount("");
    setLoanId("");
    setLoanQuery("");
    setReference("");
    setReceipt("");
    setCheque("");
    setNarration("");
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function chooseCategory(categoryKey: string) {
    setCategoryFocus(categoryKey);
    setSelectedCategory(categoryKey);
    setType("");
    clearTransactionDetails();
    setOpenStep(2);
  }

  function openCategoryStep() {
    setType("");
    clearTransactionDetails();
    setOpenStep((current) => (current === 1 ? null : 1));
  }

  function openTypeStep() {
    setType("");
    clearTransactionDetails();
    setOpenStep((current) => (current === 2 ? null : 2));
  }

  if (forbidden) {
    return (
      <div className="space-y-5">
        <TellerWorkspaceHeader till={till} activeTab="new" />
        <ForbiddenPanel message="Your role cannot use the teller console. Ask an administrator for Transaction : Create." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TellerWorkspaceHeader till={till} activeTab="new" />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-5">
        {/* Stepper */}
        <div className="mb-5 space-y-2">
          <div className="flex items-center gap-3">
            <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground fs-text font-bold">1</span>
            <UsersRound className="size-4 text-primary" aria-hidden="true" />
            <span className="fs-text font-bold text-primary">Client Transaction</span>
            <button type="button" onClick={openCategoryStep} className="ml-auto" aria-label="Change category">
              <ChevronDown className={`size-4 text-primary transition-transform ${openStep === 1 ? "rotate-180" : ""}`} />
            </button>
          </div>
          {openStep === 1 ? (
            <div className="ml-10 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {TELLER_CATEGORIES.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => chooseCategory(category.key)}
                  className={`flex min-h-[100px] flex-col items-center justify-center rounded-[var(--card-radius)] border p-3 text-center transition-colors hover:border-primary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${categoryFocus === category.key ? "border-2 border-primary" : "border border-card-border"}`}
                >
                  <span className="mb-2 grid size-[34px] place-items-center rounded-[10px] bg-primary-tint text-primary">
                    {category.icon ? <category.icon className="size-5" aria-hidden="true" /> : <CircleDollarSign className="size-5" aria-hidden="true" />}
                  </span>
                  <span className="block fs-text font-semibold text-strong">{category.label}</span>
                  <span className="mt-1 block fs-caption leading-[1.35] text-muted-foreground">{category.description}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground fs-text font-bold">2</span>
            <CircleDollarSign className="size-4 text-primary" aria-hidden="true" />
            <span className="fs-text font-bold text-primary">Disburse Loan</span>
            <button type="button" onClick={openTypeStep} className="ml-auto" aria-label="Change type">
              <ChevronDown className={`size-4 text-primary transition-transform ${openStep === 2 ? "rotate-180" : ""}`} />
            </button>
          </div>
          {openStep === 2 ? (
            <div className="ml-10 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {selectedCategoryDetails?.types.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={!AVAILABLE_TYPES.has(item)}
                  onClick={() => { setType(item); setOpenStep(null); clearTransactionDetails(); }}
                  className="flex min-h-[90px] flex-col items-center justify-center rounded-[var(--card-radius)] border border-card-border bg-surface p-4 text-center transition-colors hover:border-primary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="mb-2 grid size-[34px] place-items-center rounded-[10px] bg-primary-tint text-primary">
                    <CircleDollarSign className="size-5" aria-hidden="true" />
                  </span>
                  <span className="block fs-text font-semibold text-strong">{TYPE_LABELS[item]}</span>
                  <span className="mt-1 block fs-caption leading-[1.35] text-muted-foreground">{TYPE_DESCRIPTIONS[item]}</span>
                  {!AVAILABLE_TYPES.has(item) ? <span className="mt-1 fs-caption text-muted-foreground">Not available locally</span> : null}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <span className="grid size-7 place-items-center rounded-full bg-heading text-white fs-text font-bold">3</span>
            <span className="fs-text font-bold text-heading">Enter Transaction Details</span>
          </div>
        </div>

        {selectedCategoryDetails && type ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isOpen ? (
              <div className="rounded-[var(--card-radius)] border border-accent-red/30 bg-accent-red/5 p-4">
                <p className="fs-text text-accent-red" role="alert">
                  No till session is open. Open a till before posting transactions.
                </p>
                <Button type="button" variant="outline" onClick={() => setType("TILL_OPENING")} className="mt-2 h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
                  Open till
                </Button>
              </div>
            ) : null}

            {/* Block A: Account & Client Information */}
            <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
              <div className="border-b border-card-border px-[var(--space-16)] py-[var(--space-12)]">
                <h2 className="fs-text font-bold text-strong">Account &amp; Client Information</h2>
              </div>
              <div className="space-y-4 p-[var(--space-16)]">
                <div>
                  <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-loan-search">
                    Search Account <span className="text-accent-red" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="transaction-loan"
                    value={loanId}
                    onChange={(event) => {
                      const nextLoanId = event.target.value;
                      setLoanId(nextLoanId);
                      const nextLoan = loans.find((loan) => loan.id === nextLoanId);
                      if (nextLoan) {
                        const fee = (BigInt(nextLoan.principalMinor) * BigInt(nextLoan.productManagementFeeBp ?? 0)) / 10000n;
                        const net = BigInt(nextLoan.principalMinor) - fee;
                        setAmount((Number(net) / 100).toFixed(2));
                      } else {
                        setAmount("");
                      }
                    }}
                    className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                    required
                  >
                    <option value="">No approved loans awaiting disbursement</option>
                    {loans
                      .filter((loan) => {
                        const q = loanQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (loan.loanNumber ?? "").toLowerCase().includes(q) ||
                          (loan.clientName ?? "").toLowerCase().includes(q) ||
                          (loan.clientReference ?? "").toLowerCase().includes(q) ||
                          (loan.productName ?? "").toLowerCase().includes(q)
                        );
                      })
                      .map((loan) => (
                        <option key={loan.id} value={loan.id}>
                          {loan.productName?.toUpperCase() ?? "LOAN"}{" "}
                          <span className="text-muted-foreground">● New</span>{" "}
                          {loan.loanNumber} - {loan.clientName ?? loan.clientReference ?? "Unknown"}
                        </option>
                      ))}
                  </select>
                  <Input
                    id="transaction-loan-search"
                    value={loanQuery}
                    onChange={(event) => setLoanQuery(event.target.value)}
                    placeholder="Search account number, member name, member ID or product"
                    className="mt-2 h-[var(--control-height)]"
                  />
                </div>

                {selectedLoan ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Client Information */}
                      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
                        <h3 className="mb-3 fs-text font-bold text-strong">Client Information</h3>
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-2">
                            <div className="grid size-16 place-items-center rounded-full bg-indigo-100 text-indigo-700 fs-title font-bold">
                              {(selectedLoan.clientName ?? "NA")
                                .split(" ")
                                .map((part) => part.charAt(0))
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="w-24 rounded border border-dashed border-card-border p-1 text-center fs-caption text-muted-foreground">
                              Signature
                            </div>
                          </div>
                          <dl className="grid flex-1 gap-2">
                            <div>
                              <dt className="fs-caption font-bold uppercase text-label">Email address</dt>
                              <dd className="fs-text text-body">{selectedLoan.clientEmail ?? "N.A."}</dd>
                            </div>
                            <div>
                              <dt className="fs-caption font-bold uppercase text-label">Phone number</dt>
                              <dd className="fs-text text-body">{selectedLoan.clientPhone ?? "N.A."}</dd>
                            </div>
                            <div>
                              <dt className="fs-caption font-bold uppercase text-label">Branch name</dt>
                              <dd className="fs-text text-body">{selectedLoan.clientBranchName ?? "N.A."}</dd>
                            </div>
                            <div>
                              <dt className="fs-caption font-bold uppercase text-label">Policy name</dt>
                              <dd className="fs-text text-body">{selectedLoan.productName ?? "N.A."}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      {/* Account Details */}
                      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
                        <h3 className="mb-3 fs-text font-bold text-strong">Account Details</h3>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Member name</dt>
                            <dd className="fs-text text-body">{selectedLoan.clientName ?? "N.A."}</dd>
                          </div>
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Account number</dt>
                            <dd className="fs-text font-mono text-body">{selectedLoan.loanNumber}</dd>
                          </div>
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Product name</dt>
                            <dd className="fs-text text-body">{selectedLoan.productName ?? "N.A."}</dd>
                          </div>
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Member ID</dt>
                            <dd className="fs-text text-body">{selectedLoan.clientMemberNo ?? "N.A."}</dd>
                          </div>
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Member type</dt>
                            <dd className="fs-text text-body">Individual</dd>
                          </div>
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Reference number</dt>
                            <dd className="fs-text text-body">{selectedLoan.clientReference ?? "N.A."}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="fs-caption font-bold uppercase text-label">Address</dt>
                            <dd className="fs-text text-body">
                              {(() => {
                                const profile = selectedLoan.clientProfile as Record<string, unknown> | null;
                                const residence = profile?.residenceDetails as Record<string, unknown> | undefined;
                                const current = residence?.currentAddress;
                                return typeof current === "string" && current ? current : "N.A.";
                              })()}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* Block B: Loan Information */}
                    <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
                      <div className="flex items-center justify-between border-b border-card-border bg-subtle px-[var(--space-16)] py-[var(--space-12)]">
                        <h2 className="fs-text font-bold text-strong">Loan Information</h2>
                        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div className="space-y-4 p-[var(--space-16)]">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Loan officer</dt>
                            <dd className="fs-text text-body">{selectedLoan.loanOfficerName ?? "N.A."}</dd>
                          </div>
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Status</dt>
                            <dd className="fs-text text-body">
                              <span className="rounded bg-amber-100 px-2 py-0.5 fs-caption font-semibold text-amber-800">New</span>
                            </dd>
                          </div>
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Nominal interest rate</dt>
                            <dd className="fs-text text-body">{(selectedLoan.interestRateBp / 100).toFixed(2)} %</dd>
                          </div>
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Tenure</dt>
                            <dd className="fs-text text-body">{selectedLoan.tenureCount} {selectedLoan.tenurePeriod.charAt(0) + selectedLoan.tenurePeriod.slice(1).toLowerCase()}</dd>
                          </div>
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Expiry date</dt>
                            <dd className="fs-text text-body">{selectedLoan.installmentStartDate ?? "N.A."}</dd>
                          </div>
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Principal loan amount (TSH)</dt>
                            <dd className="fs-text text-body">{formatMinorUnitsExact(selectedLoan.principalMinor)}</dd>
                          </div>
                          <div>
                            <dt className="fs-caption font-bold uppercase text-label">Amount to be disburse (TSH)</dt>
                            <dd className="fs-text font-bold text-body">{formatMinorUnitsExact(amountToBeDisbursedMinor)}</dd>
                          </div>
                        </dl>

                        <div>
                          <h4 className="mb-2 fs-text font-bold text-strong">Loan Charges</h4>
                          <div className="overflow-x-auto rounded-[var(--card-radius)] border border-card-border">
                            <table className="w-full min-w-[320px] text-left fs-text">
                              <thead className="border-b border-card-border bg-subtle font-semibold text-label">
                                <tr>
                                  <th className="px-3 py-2">Charge fee type</th>
                                  <th className="px-3 py-2 text-right">Balance (TSH)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-card-border">
                                  <td className="px-3 py-2">LOAN MANAGEMENT FEE</td>
                                  <td className="px-3 py-2 text-right">{formatMinorUnitsExact(feeMinor)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Block C: Transaction Details */}
                    <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
                      <div className="flex items-center justify-between border-b border-card-border bg-subtle px-[var(--space-16)] py-[var(--space-12)]">
                        <h2 className="fs-text font-bold text-strong">Transaction Details</h2>
                        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div className="space-y-4 p-[var(--space-16)]">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-date">
                              Transaction Date <span className="text-accent-red" aria-hidden="true">*</span>
                            </label>
                            <div className="relative">
                              <Input
                                id="transaction-date"
                                type="date"
                                value={transactionDate}
                                onChange={(e) => setTransactionDate(e.target.value)}
                                className="h-[var(--control-height)] pr-10"
                              />
                              <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-mode">
                              Transaction Mode <span className="text-accent-red" aria-hidden="true">*</span>
                            </label>
                            <select
                              id="transaction-mode"
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                            >
                              <option value="CASH">Cash</option>
                              <option value="BANK">Bank</option>
                              <option value="CHEQUE">Cheque</option>
                              <option value="MOBILE">Mobile Money</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-till">
                            Till Account <span className="text-accent-red" aria-hidden="true">*</span>
                          </label>
                          <div className="rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] py-2 fs-text text-body">
                            <span className="font-bold">Till</span>
                            <br />
                            <span className="font-mono text-muted-foreground">1010</span>
                            <span className="text-muted-foreground"> - </span>
                            <span>{till?.session?.branchName ?? "Teller"}</span>
                            <span className="ml-2 rounded bg-subtle px-1.5 py-0.5 fs-caption text-muted-foreground">Till</span>
                          </div>
                          <p className="mt-1 fs-text text-muted-foreground">
                            Account Balance (TSh):{" "}
                            <span className="font-bold">
                              {till?.session?.systemBalanceMinor
                                ? `DR ${formatMinorUnitsExact(till.session.systemBalanceMinor)}`
                                : "Unavailable"}
                            </span>
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div>
                            <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-reference">
                              Reference
                            </label>
                            <Input id="transaction-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference number" className="h-[var(--control-height)]" />
                          </div>
                          <div>
                            <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-receipt">
                              Receipt #
                            </label>
                            <Input id="transaction-receipt" value={receipt} onChange={(e) => setReceipt(e.target.value)} placeholder="Receipt number" className="h-[var(--control-height)]" />
                          </div>
                          <div>
                            <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-cheque">
                              Cheque #
                            </label>
                            <Input id="transaction-cheque" value={cheque} onChange={(e) => setCheque(e.target.value)} placeholder="Cheque number" className="h-[var(--control-height)]" />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-narration">
                            Narration / Description
                          </label>
                          <Input id="transaction-narration" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="A clear description of this transaction" className="h-[var(--control-height)]" />
                        </div>

                        <div className="flex justify-end">
                          <div className="w-full md:w-1/2">
                            <label className="mb-1 block fs-text font-medium text-body" htmlFor="transaction-amount">
                              Amount <span className="text-accent-red" aria-hidden="true">*</span>
                            </label>
                            <Input
                              id="transaction-amount"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="h-[var(--control-height)] text-right"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-card-border pt-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setLoanId("");
                              setLoanQuery("");
                              clearTransactionDetails();
                            }}
                            className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold"
                          >
                            <RefreshCw className="size-4" aria-hidden="true" />
                            Reset
                          </Button>
                          <Button
                            type="submit"
                            disabled={submitting || !isOpen || !amountValid || !loanId}
                            className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold"
                          >
                            {submitting ? "Posting..." : "Submit"}
                            <Check className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </section>
                  </>
                ) : null}
              </div>
            </section>

            {submitError ? <p className="fs-text text-accent-red" role="alert">{submitError}</p> : null}
            {submitSuccess ? <p className="fs-text text-accent-teal" role="status">{submitSuccess}</p> : null}
          </form>
        ) : null}
      </section>
    </div>
  );
}
