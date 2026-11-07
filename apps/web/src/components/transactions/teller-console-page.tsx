"use client";

import { useEffect, useState } from "react";
import {
  BookOpenText,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Search,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { ErrorPanel, ForbiddenPanel } from "@/components/accounting/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TellerWorkspaceHeader } from "@/components/transactions/teller-workspace-header";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
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
    icon: BookOpenText,
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
  SHARES_DEPOSIT: "Add funds to a member’s share account.",
  SHARES_WITHDRAWAL: "Withdraw funds from a member’s share account.",
  SAVINGS_DEPOSIT: "Add funds to a member’s savings account.",
  SAVINGS_WITHDRAWAL: "Withdraw funds from a member’s savings account.",
  LOAN_REPAYMENT: "Record a payment made towards a loan.",
  LOAN_DISBURSEMENT: "Release funds for an approved loan.",
  FEE_PENALTY_APPLY: "Apply a fee, penalty, or application charge.",
  FEE_PENALTY_REVERSE: "Reverse a previously applied charge.",
  LOAN_APPLICATION_FEE: "Pay fees for pending loan applications.",
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
  const [clientId, setClientId] = useState("");
  const [savingsAccountId, setSavingsAccountId] = useState("");
  const [loanId, setLoanId] = useState("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanQuery, setLoanQuery] = useState("");
  const selectedLoan = loans.find((loan) => loan.id === loanId) ?? null;
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
    if (type !== "LOAN_DISBURSEMENT") return;
    let cancelled = false;
    void listLoans({})
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
  const selectedCategoryDetails = TELLER_CATEGORIES.find(
    (category) => category.key === selectedCategory,
  );
  const requiresClient = selectedCategory === "client";
  const requiresSavingsAccount = type === "SAVINGS_DEPOSIT" || type === "SAVINGS_WITHDRAWAL";
  const requiresLoan = type.startsWith("LOAN_");
  const requiresLedgerAccount = selectedCategory === "ledger";
  function clearTransactionDetails() {
    setAmount("");
    setClientId("");
    setSavingsAccountId("");
    setLoanId("");
    setCounterAccountCode("");
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
    <div className="space-y-1">
      <TellerWorkspaceHeader till={till} activeTab="new" />

      {error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-5">
        <div>
          <div>
            <button
              type="button"
              aria-expanded={openStep === 1}
              onClick={openCategoryStep}
              className="mb-4 inline-flex min-h-[39px] items-center gap-3 rounded-full border border-card-border bg-surface py-1 pl-2 pr-4 fs-text font-semibold text-strong hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label={`Step 1 of 2: ${openStep === 1 ? "Choose Category" : (selectedCategoryDetails?.label ?? "Choose Category")}`}
            >
              <span className="grid size-[27px] place-items-center rounded-full bg-primary text-primary-foreground">
                1
              </span>
              <span>
                {openStep === 1
                  ? "Choose Category"
                  : (selectedCategoryDetails?.label ?? "Choose Category")}
              </span>
              {openStep === 1 ? (
                <ChevronUp className="size-4 text-primary" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-4 text-primary" aria-hidden="true" />
              )}
            </button>
            {openStep === 1 ? (
              <div className="grid max-w-[927px] grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {TELLER_CATEGORIES.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => chooseCategory(category.key)}
                    className={`flex min-h-[137px] flex-col items-center justify-center rounded-[var(--card-radius)] bg-surface p-3 text-center transition-colors hover:border-primary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${categoryFocus === category.key ? "border-2 border-primary" : "border border-card-border"}`}
                  >
                    <span className="mb-4 grid size-[34px] place-items-center rounded-[10px] bg-primary-tint text-primary">
                      {category.key === "client" ? (
                        <UsersRound className="size-5" aria-hidden="true" />
                      ) : category.key === "ledger" ? (
                        <BookOpenText className="size-5" aria-hidden="true" />
                      ) : category.key === "till" ? (
                        <WalletCards className="size-5" aria-hidden="true" />
                      ) : (
                        <UsersRound className="size-5" aria-hidden="true" />
                      )}
                    </span>
                    <span className="block fs-text font-semibold text-strong">
                      {category.label}
                    </span>
                    <span className="mt-1 block max-w-[260px] fs-caption leading-[1.35] text-muted-foreground">
                      {category.description}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {selectedCategoryDetails ? (
            <div className={openStep === 1 ? "mt-4" : ""}>
              <button
                type="button"
                aria-expanded={openStep === 2}
                onClick={openTypeStep}
                className="mb-4 inline-flex min-h-[39px] items-center gap-3 rounded-full border border-card-border bg-surface py-1 pl-2 pr-4 fs-text font-semibold text-strong hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label={`Step 2 of 2: ${openStep === 2 ? "Choose Type" : type ? TYPE_LABELS[type] : "Choose Type"}`}
              >
                <span className="grid size-[27px] place-items-center rounded-full bg-primary text-primary-foreground">
                  2
                </span>
                <span>
                  {openStep === 2 ? "Choose Type" : type ? TYPE_LABELS[type] : "Choose Type"}
                </span>
                {openStep === 2 ? (
                  <ChevronUp className="size-4 text-primary" aria-hidden="true" />
                ) : (
                  <ChevronDown className="size-4 text-primary" aria-hidden="true" />
                )}
              </button>
              {openStep === 2 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedCategoryDetails.types.map((item) => (
                    <button
                      key={item}
                      type="button"
                      disabled={!AVAILABLE_TYPES.has(item)}
                      onClick={() => {
                        setType(item);
                        setOpenStep(null);
                        clearTransactionDetails();
                      }}
                      className="flex min-h-[112px] flex-col items-center justify-center rounded-[var(--card-radius)] border border-card-border bg-surface p-4 text-center transition-colors hover:border-primary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="mb-2 grid size-[34px] place-items-center rounded-[10px] bg-primary-tint text-primary">
                        <CircleDollarSign className="size-5" aria-hidden="true" />
                      </span>
                      <span className="block fs-text font-semibold text-strong">
                        {TYPE_LABELS[item]}
                      </span>
                      <span className="mt-1 block fs-caption leading-[1.35] text-muted-foreground">
                        {TYPE_DESCRIPTIONS[item]}
                      </span>
                      {!AVAILABLE_TYPES.has(item) ? (
                        <span className="mt-1 fs-caption text-muted-foreground">
                          Not available locally
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {selectedCategoryDetails && type ? (
            <div className="border-t border-card-border pt-4">
              <h2 className="mb-4 fs-text font-bold text-strong">{TYPE_LABELS[type]}</h2>
              {selectedCategory === "till" ? (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--card-radius)] border border-card-border bg-subtle p-3">
                  <div>
                    <p className="fs-text font-semibold text-strong">
                      Till status: {isOpen ? "Open" : "Closed"}
                    </p>
                    <p className="fs-caption text-muted-foreground">
                      {till?.businessDate ?? "Today"} · Cash in{" "}
                      {formatTzs(till?.cashInMinor ?? "0")} · Cash out{" "}
                      {formatTzs(till?.cashOutMinor ?? "0")}
                    </p>
                    {isOpen ? (
                      <p className="fs-caption text-muted-foreground">
                        System balance {formatTzs(till?.session?.systemBalanceMinor ?? "0")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    {type === "TILL_OPENING" && !isOpen ? (
                      <>
                        <div>
                          <label
                            className="mb-1 block fs-caption font-medium text-body"
                            htmlFor="open-float"
                          >
                            Opening float (minor units)
                          </label>
                          <Input
                            id="open-float"
                            value={openFloat}
                            onChange={(event) => setOpenFloat(event.target.value)}
                            placeholder="0"
                            className="h-[var(--control-height)] w-[180px]"
                          />
                        </div>
                        <Button type="button" onClick={handleOpenTill} disabled={!openFloat}>
                          Open till
                        </Button>
                      </>
                    ) : type === "TILL_CLOSING" && isOpen ? (
                      <>
                        <div>
                          <label
                            className="mb-1 block fs-caption font-medium text-body"
                            htmlFor="counted-cash"
                          >
                            Counted cash (minor units)
                          </label>
                          <Input
                            id="counted-cash"
                            value={countedCash}
                            onChange={(event) => setCountedCash(event.target.value)}
                            placeholder="0"
                            className="h-[var(--control-height)] w-[180px]"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCloseTill}
                          disabled={!countedCash}
                        >
                          Close till
                        </Button>
                      </>
                    ) : null}
                  </div>
                  {tillActionError ? (
                    <p className="w-full fs-text text-accent-red" role="alert">
                      {tillActionError}
                    </p>
                  ) : null}
                  {till?.session?.status === "CLOSED" &&
                  till.session.varianceMinor &&
                  till.session.varianceMinor !== "0" ? (
                    <p className="w-full fs-text text-accent-yellow" role="status">
                      Variance {formatTzs(till.session.varianceMinor)} recorded as a pending
                      request.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {selectedCategory !== "till" ? (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label
                        className="mb-1 block fs-caption font-medium text-body"
                        htmlFor="transaction-type-display"
                      >
                        Transaction type
                      </label>
                      <Input
                        id="transaction-type-display"
                        value={TYPE_LABELS[type]}
                        readOnly
                        className="h-[var(--control-height)] bg-subtle"
                      />
                    </div>
                    <div>
                      <label
                        className="mb-1 block fs-text font-medium text-body"
                        htmlFor="transaction-amount"
                      >
                        Amount (minor units)
                      </label>
                      <Input
                        id="transaction-amount"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="0"
                        className="h-[var(--control-height)]"
                        required
                      />
                    </div>
                    <div>
                      <label
                        className="mb-1 block fs-text font-medium text-body"
                        htmlFor="transaction-payment"
                      >
                        Payment method
                      </label>
                      <select
                        id="transaction-payment"
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                        className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                      >
                        <option value="CASH">Cash</option>
                        <option value="BANK">Bank</option>
                        <option value="MNO">Mobile money</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>
                    {requiresClient ? (
                      <div>
                        <label
                          className="mb-1 block fs-caption font-medium text-body"
                          htmlFor="transaction-client"
                        >
                          Client ID *
                        </label>
                        <Input
                          id="transaction-client"
                          value={clientId}
                          onChange={(event) => setClientId(event.target.value)}
                          placeholder="Enter client ID"
                          className="h-[var(--control-height)]"
                          required
                        />
                      </div>
                    ) : null}
                    {requiresSavingsAccount ? (
                      <div>
                        <label
                          className="mb-1 block fs-caption font-medium text-body"
                          htmlFor="transaction-savings"
                        >
                          Search Account *
                        </label>
                        <div className="relative">
                          <Search
                            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <Input
                            id="transaction-savings"
                            value={savingsAccountId}
                            onChange={(event) => setSavingsAccountId(event.target.value)}
                            placeholder="Search..."
                            className="h-[var(--control-height)] pl-8"
                            required
                          />
                        </div>
                      </div>
                    ) : null}
                    {requiresLoan ? (
                      <div>
                        <label
                          className="mb-1 block fs-caption font-medium text-body"
                          htmlFor="transaction-loan"
                        >
                          Loan account *
                        </label>
                        <Input
                          id="transaction-loan-search"
                          value={loanQuery}
                          onChange={(event) => setLoanQuery(event.target.value)}
                          placeholder="Search account number or member name"
                          className="mb-2 h-[var(--control-height)]"
                        />
                        <select
                          id="transaction-loan"
                          value={loanId}
                          onChange={(event) => setLoanId(event.target.value)}
                          className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                          required
                        >
                          <option value="">Select approved loan</option>
                          {loans
                            .filter((loan) => {
                              const q = loanQuery.trim().toLowerCase();
                              if (!q) return true;
                              return (
                                (loan.loanNumber ?? "").toLowerCase().includes(q) ||
                                (loan.clientName ?? "").toLowerCase().includes(q) ||
                                (loan.clientReference ?? "").toLowerCase().includes(q)
                              );
                            })
                            .map((loan) => (
                              <option key={loan.id} value={loan.id}>
                                {loan.loanNumber} - {loan.clientName ?? loan.clientReference ?? "Unknown"} - {loan.productName ?? "Loan"}
                              </option>
                            ))}
                        </select>
                      </div>
                    ) : null}
                    {requiresLoan && selectedLoan ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-12)]">
                          <h3 className="mb-2 fs-text font-bold text-strong">Client Information</h3>
                          <dl className="grid gap-2">
                            <div><dt className="fs-text text-muted-foreground">Member name</dt><dd className="fs-text text-strong">{selectedLoan.clientName ?? "N.A."}</dd></div>
                            <div><dt className="fs-text text-muted-foreground">Member ID</dt><dd className="fs-text text-strong">{selectedLoan.clientReference ?? "N.A."}</dd></div>
                            <div><dt className="fs-text text-muted-foreground">Branch</dt><dd className="fs-text text-strong">Mwanza Branch</dd></div>
                          </dl>
                        </div>
                        <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-12)]">
                          <h3 className="mb-2 fs-text font-bold text-strong">Loan Information</h3>
                          <dl className="grid gap-2">
                            <div><dt className="fs-text text-muted-foreground">Loan number</dt><dd className="fs-text text-strong">{selectedLoan.loanNumber}</dd></div>
                            <div><dt className="fs-text text-muted-foreground">Product</dt><dd className="fs-text text-strong">{selectedLoan.productName ?? "N.A."}</dd></div>
                            <div><dt className="fs-text text-muted-foreground">Principal</dt><dd className="fs-text text-strong">{formatTzs(selectedLoan.principalMinor)}</dd></div>
                            <div><dt className="fs-text text-muted-foreground">Outstanding</dt><dd className="fs-text text-strong">{formatTzs(selectedLoan.outstandingPrincipalMinor)}</dd></div>
                            <div><dt className="fs-text text-muted-foreground">Interest rate</dt><dd className="fs-text text-strong">{(selectedLoan.interestRateBp / 100).toFixed(2)}%</dd></div>
                          </dl>
                        </div>
                      </div>
                    ) : null}
                    {requiresLedgerAccount ? (
                      <div>
                        <label
                          className="mb-1 block fs-caption font-medium text-body"
                          htmlFor="transaction-counter"
                        >
                          Counter account code *
                        </label>
                        <Input
                          id="transaction-counter"
                          value={counterAccountCode}
                          onChange={(event) => setCounterAccountCode(event.target.value)}
                          placeholder="Search..."
                          className="h-[var(--control-height)]"
                          required
                        />
                      </div>
                    ) : null}
                    <div>
                      <label
                        className="mb-1 block fs-text font-medium text-body"
                        htmlFor="transaction-narration"
                      >
                        Narration
                      </label>
                      <Input
                        id="transaction-narration"
                        value={narration}
                        onChange={(event) => setNarration(event.target.value)}
                        placeholder="Optional"
                        className="h-[var(--control-height)]"
                      />
                    </div>
                  </div>
                  {submitError ? (
                    <p className="fs-text text-accent-red" role="alert">
                      {submitError}
                    </p>
                  ) : null}
                  {submitSuccess ? (
                    <p className="fs-text text-accent-teal" role="status">
                      {submitSuccess}
                    </p>
                  ) : null}
                  <Button type="submit" disabled={submitting || !amount}>
                    {submitting ? "Posting..." : "Post transaction"}
                  </Button>
                </form>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
