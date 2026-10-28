"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  LoaderCircle,
  Paperclip,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import { FormError, ForbiddenPanel } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { parseMajorToMinor } from "@/lib/accounting";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import {
  createLoanApplication,
  updateLoanApplication,
  listClients,
  listEconomicSectors,
  listLoanOfficers,
  listLoanProducts,
  type Client,
  type EconomicSector,
  type LoanApplication,
  type LoanApplicationDocumentInput,
  type LoanApplicationInput,
  type LoanDocumentKind,
  type LoanInterestMethod,
  type LoanOfficer,
  type LoanProduct,
  type LoanTenurePeriod,
  type PaymentDestination,
} from "@/lib/settings";

const STEPS = [
  { key: "details", label: "Details" },
  { key: "additional", label: "Additional details" },
  { key: "nominee", label: "Next of kin" },
  { key: "payment", label: "Payment destination" },
  { key: "documents", label: "Documents" },
] as const;

const TENURE_PERIODS: { value: LoanTenurePeriod; label: string }[] = [
  { value: "MONTHS", label: "Months" },
  { value: "WEEKS", label: "Weeks" },
  { value: "DAYS", label: "Days" },
];

const INTEREST_METHODS: { value: LoanInterestMethod; label: string }[] = [
  { value: "REDUCING_BALANCE_EQUAL_INSTALLMENT", label: "Reducing balance with equal installment" },
  { value: "REDUCING_BALANCE_EQUAL_PRINCIPAL", label: "Reducing balance with equal principal" },
  { value: "FLAT_RATE", label: "Flat rate" },
];

const PURPOSES = [
  "Working capital",
  "Business expansion",
  "Agriculture inputs",
  "Asset purchase",
  "School fees",
  "Medical expenses",
  "Other",
];

const RELATIONS = ["Spouse", "Parent", "Child", "Sibling", "Guardian", "Other"];

const BANKS = ["CRDB Bank", "NMB Bank", "NBC Bank", "Equity Bank", "Stanbic Bank", "Absa Bank", "Other"];

const WALLETS = ["M-Pesa", "Tigo Pesa", "Airtel Money", "HaloPesa"];

const DOCUMENT_KINDS: { value: LoanDocumentKind; label: string }[] = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "PAYSLIP", label: "Payslip" },
  { value: "BANK_STATEMENT", label: "Bank statement" },
  { value: "BUSINESS_LICENSE", label: "Business licence" },
  { value: "COLLATERAL", label: "Collateral" },
  { value: "OTHER", label: "Other" },
];

const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
const MAX_DOCUMENTS = 5;

type Attachment = {
  id: string;
  kind: LoanDocumentKind;
  name: string;
  sizeBytes: number;
  dataUrl: string;
};

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function LoanApplicationWizard({
  initial,
  applicationId,
}: {
  initial?: LoanApplication;
  applicationId?: string;
} = {}) {
  const router = useRouter();
  const { pushToast } = useToast();

  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"DRAFT" | "SUBMITTED" | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [officers, setOfficers] = useState<LoanOfficer[]>([]);
  const [sectors, setSectors] = useState<EconomicSector[]>([]);

  const [clientQuery, setClientQuery] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);

  const [clientId, setClientId] = useState("");
  const [productId, setProductId] = useState("");
  const [principal, setPrincipal] = useState("");
  const [tenure, setTenure] = useState("12");
  const [tenurePeriod, setTenurePeriod] = useState<LoanTenurePeriod>("MONTHS");
  const [gracePeriod, setGracePeriod] = useState("0");
  const [interestRate, setInterestRate] = useState("");
  const [interestMethod, setInterestMethod] = useState<LoanInterestMethod>(
    "REDUCING_BALANCE_EQUAL_INSTALLMENT",
  );
  const [interestOnGrace, setInterestOnGrace] = useState(false);
  const [installmentStartDate, setInstallmentStartDate] = useState(todayIso());
  const [loanOfficerId, setLoanOfficerId] = useState("");
  const [debtCapacity, setDebtCapacity] = useState("");
  const [economicSector, setEconomicSector] = useState("");
  const [subEconomicSector, setSubEconomicSector] = useState("");
  const [subSubEconomicSector, setSubSubEconomicSector] = useState("");
  const [description, setDescription] = useState("");

  const [purpose, setPurpose] = useState("");
  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [hasCollateral, setHasCollateral] = useState(false);
  const [disbursementPreference, setDisbursementPreference] = useState("Cash at branch");
  const [remarks, setRemarks] = useState("");

  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("");
  const [nomineePhone, setNomineePhone] = useState("");
  const [nomineeIdNumber, setNomineeIdNumber] = useState("");
  const [nomineePercentage, setNomineePercentage] = useState("");

  const [paymentDestination, setPaymentDestination] = useState<PaymentDestination>("CASH");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [mnoProvider, setMnoProvider] = useState("");
  const [mnoWalletNumber, setMnoWalletNumber] = useState("");

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (!initial) return;
    setClientId(initial.clientId ?? "");
    setProductId(initial.productId ?? "");
    setPrincipal((BigInt(initial.principalMinor) / 100n).toString());
    setTenure(String(initial.tenureCount));
    setTenurePeriod(initial.tenurePeriod);
    setGracePeriod(String(initial.gracePeriodMonths));
    setInterestRate((initial.interestRateBp / 100).toFixed(2));
    setInterestMethod(initial.interestMethod);
    setInterestOnGrace(initial.interestOnGrace);
    setInstallmentStartDate(initial.installmentStartDate ?? todayIso());
    setLoanOfficerId(initial.loanOfficerId ?? "");
    setDebtCapacity(
      initial.debtCapacityMinor ? (BigInt(initial.debtCapacityMinor) / 100n).toString() : "",
    );
    setEconomicSector(initial.economicSector ?? "");
    setSubEconomicSector(initial.subEconomicSector ?? "");
    setSubSubEconomicSector(initial.subSubEconomicSector ?? "");
    setDescription(initial.description ?? "");
    setPurpose(initial.purpose ?? "");
    setHasGuarantor(initial.hasGuarantor);
    setHasCollateral(initial.hasCollateral);
    setDisbursementPreference(initial.disbursementPreference ?? "Cash at branch");
    setRemarks(initial.remarks ?? "");
    setNomineeName(initial.nomineeName ?? "");
    setNomineeRelation(initial.nomineeRelation ?? "");
    setNomineePhone(initial.nomineePhone ?? "");
    setNomineeIdNumber(initial.nomineeIdNumber ?? "");
    setNomineePercentage(initial.nomineePercentage !== null ? String(initial.nomineePercentage) : "");
    setPaymentDestination(initial.paymentDestination ?? "CASH");
    setBankName(initial.bankName ?? "");
    setBankAccountName(initial.bankAccountName ?? "");
    setBankAccountNumber(initial.bankAccountNumber ?? "");
    setMnoProvider(initial.mnoProvider ?? "");
    setMnoWalletNumber(initial.mnoWalletNumber ?? "");
    void listClients({}).then((result) => setClients(result.items)).catch(() => {});
  }, [initial]);

  useEffect(() => {
    let active = true;
    void Promise.all([listLoanProducts({ status: "ACTIVE" }), listLoanOfficers(), listEconomicSectors()])
      .then(([productResult, officerResult, sectorResult]) => {
        if (!active) return;
        setProducts(productResult.items);
        setOfficers(officerResult.items);
        setSectors(sectorResult.items);
        setOptionsError(null);
      })
      .catch((failure: unknown) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else setOptionsError(message(failure, "Could not load the loan application options."));
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!clientOpen) return;
    let active = true;
    const timer = setTimeout(() => {
      setClientLoading(true);
      void listClients({ q: clientQuery })
        .then((result) => {
          if (active) setClients(result.items);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setClientLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [clientQuery, clientOpen]);

  const selectedClient = clients.find((client) => client.id === clientId) ?? null;
  const selectedProduct = products.find((product) => product.id === productId) ?? null;
  const sector = sectors.find((item) => item.code === economicSector) ?? null;
  const subSector = sector?.children.find((item) => item.code === subEconomicSector) ?? null;

  function chooseProduct(id: string) {
    setProductId(id);
    const product = products.find((item) => item.id === id);
    if (!product) return;
    setInterestRate((product.interestRateBp / 100).toFixed(2));
    const method = INTEREST_METHODS.find((item) => item.value === product.interestMethod);
    if (method) setInterestMethod(method.value);
    setTenure(String(product.minTenureMonths));
    setTenurePeriod("MONTHS");
    setGracePeriod(String(Math.round(product.gracePeriodDays / 30)));
  }

  const validateStep = useCallback(
    (index: number): string | null => {
      if (index === 0) {
        if (!clientId) return "Select the client applying for this loan.";
        if (!productId) return "Select a loan product.";
        const principalMinor = parseMajorToMinor(principal);
        if (principalMinor === null || principalMinor <= 0n) {
          return "Enter a principal amount greater than zero.";
        }
        if (selectedProduct) {
          const min = BigInt(selectedProduct.minPrincipalMinor);
          const max = BigInt(selectedProduct.maxPrincipalMinor);
          if (principalMinor < min || principalMinor > max) {
            return `Principal must be between ${formatTzs(selectedProduct.minPrincipalMinor)} and ${formatTzs(selectedProduct.maxPrincipalMinor)} for ${selectedProduct.name}.`;
          }
        }
        const count = Number(tenure);
        if (!Number.isInteger(count) || count < 1 || count > 600) {
          return "Tenure must be a whole number between 1 and 600.";
        }
        if (selectedProduct) {
          const equivalentMonths =
            tenurePeriod === "DAYS"
              ? Math.ceil(count / 30)
              : tenurePeriod === "WEEKS"
                ? Math.ceil((count * 7) / 30)
                : count;
          if (
            equivalentMonths < selectedProduct.minTenureMonths ||
            equivalentMonths > selectedProduct.maxTenureMonths
          ) {
            return `Tenure must fall between ${selectedProduct.minTenureMonths} and ${selectedProduct.maxTenureMonths} months for ${selectedProduct.name}.`;
          }
        }
        const rate = Number(interestRate);
        if (!Number.isFinite(rate) || rate < 0) return "Enter a valid interest rate.";
        const grace = Number(gracePeriod);
        if (!Number.isInteger(grace) || grace < 0 || grace > 60) {
          return "Grace period must be a whole number of months between 0 and 60.";
        }
        if (!installmentStartDate) return "Choose the installment start date.";
        if (!loanOfficerId) return "Select the loan officer.";
        if (debtCapacity.trim() && parseMajorToMinor(debtCapacity) === null) {
          return "Debt capacity must be a valid amount.";
        }
        if (!economicSector) return "Select the economic sector.";
        return null;
      }
      if (index === 2) {
        const filled = [nomineeName, nomineeRelation, nomineePhone, nomineeIdNumber, nomineePercentage].filter(
          (value) => value.trim(),
        ).length;
        if (filled === 0) return null;
        if (!nomineeName.trim()) return "Enter the next of kin name.";
        if (!nomineeRelation) return "Select the relationship.";
        if (!nomineePhone.trim()) return "Enter the next of kin phone number.";
        const percent = Number(nomineePercentage);
        if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
          return "Nominee percentage must be a whole number between 1 and 100.";
        }
        return null;
      }
      if (index === 3) {
        if (paymentDestination === "BANK") {
          if (!bankName) return "Select the bank.";
          if (!bankAccountName.trim()) return "Enter the account name.";
          if (!bankAccountNumber.trim()) return "Enter the bank account number.";
        }
        if (paymentDestination === "MNO") {
          if (!mnoProvider) return "Select the mobile money provider.";
          if (!mnoWalletNumber.trim()) return "Enter the wallet number.";
        }
        return null;
      }
      return null;
    },
    [
      bankAccountName,
      bankAccountNumber,
      bankName,
      clientId,
      debtCapacity,
      economicSector,
      gracePeriod,
      installmentStartDate,
      interestRate,
      loanOfficerId,
      mnoProvider,
      mnoWalletNumber,
      nomineeIdNumber,
      nomineeName,
      nomineePercentage,
      nomineePhone,
      nomineeRelation,
      paymentDestination,
      principal,
      productId,
      selectedProduct,
      tenure,
      tenurePeriod,
    ],
  );

  function goNext() {
    const failure = validateStep(step);
    if (failure) {
      setStepError(failure);
      return;
    }
    setStepError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setStepError(null);
    const next: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (attachments.length + next.length >= MAX_DOCUMENTS) {
        setStepError(`Attach at most ${MAX_DOCUMENTS} documents.`);
        break;
      }
      if (file.size > MAX_DOCUMENT_BYTES) {
        setStepError(`${file.name} is larger than 2 MB.`);
        continue;
      }
      if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type)) {
        setStepError(`${file.name} must be a PDF, PNG or JPEG.`);
        continue;
      }
      const dataUrl = await readFile(file);
      next.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        kind: "OTHER",
        name: file.name,
        sizeBytes: file.size,
        dataUrl,
      });
    }
    if (next.length) setAttachments((current) => [...current, ...next]);
  }

  async function submit(status: "DRAFT" | "SUBMITTED") {
    for (let index = 0; index < STEPS.length; index += 1) {
      const failure = validateStep(index);
      if (failure) {
        setStep(index);
        setStepError(failure);
        return;
      }
    }
    setSaveError(null);
    setStepError(null);
    setSaving(status);
    try {
      const documents: LoanApplicationDocumentInput[] = attachments.map((attachment) => ({
        kind: attachment.kind,
        name: attachment.name,
        dataUrl: attachment.dataUrl,
      }));
      const payload: LoanApplicationInput = {
        clientId,
        productId: productId || null,
        principalMinor: (parseMajorToMinor(principal) ?? 0n).toString(),
        tenureCount: Number(tenure),
        tenurePeriod,
        gracePeriodMonths: Number(gracePeriod) || 0,
        interestRateBp: Math.round(Number(interestRate) * 100),
        interestMethod,
        interestOnGrace,
        installmentStartDate,
        loanOfficerId,
        debtCapacityMinor: debtCapacity.trim()
          ? (parseMajorToMinor(debtCapacity) ?? 0n).toString()
          : null,
        economicSector,
        subEconomicSector: subEconomicSector || null,
        subSubEconomicSector: subSubEconomicSector || null,
        description: description.trim() || null,
        purpose: purpose || null,
        hasGuarantor,
        hasCollateral,
        disbursementPreference,
        remarks: remarks.trim() || null,
        nomineeName: nomineeName.trim() || null,
        nomineeRelation: nomineeRelation || null,
        nomineePhone: nomineePhone.trim() || null,
        nomineeIdNumber: nomineeIdNumber.trim() || null,
        nomineePercentage: nomineePercentage.trim() ? Number(nomineePercentage) : null,
        paymentDestination,
        bankName: paymentDestination === "BANK" ? bankName : null,
        bankAccountName: paymentDestination === "BANK" ? bankAccountName.trim() : null,
        bankAccountNumber: paymentDestination === "BANK" ? bankAccountNumber.trim() : null,
        mnoProvider: paymentDestination === "MNO" ? mnoProvider : null,
        mnoWalletNumber: paymentDestination === "MNO" ? mnoWalletNumber.trim() : null,
        status,
        documents,
      };
      const response = applicationId
        ? await updateLoanApplication(applicationId, payload)
        : await createLoanApplication(payload);
      pushToast(
        applicationId
          ? `Application ${response.application.applicationNo} updated.`
          : status === "SUBMITTED"
            ? `Application ${response.application.applicationNo} submitted.`
            : `Application ${response.application.applicationNo} saved as a draft.`,
      );
      router.push("/account-loan-application");
      router.refresh();
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 403) {
        setForbidden(true);
        return;
      }
      setSaveError(message(failure, "Could not save this loan application."));
      setSaving(null);
    }
  }

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="New loan application" description="Capture a client's loan request." />
        <ForbiddenPanel message="Your role cannot create loan applications. Ask an administrator for Loan Account : Create." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {applicationId ? null : (
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href="/account-loan-application">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Loan applications
            </Link>
          </Button>
        </div>
      )}

      <PageHeader
        title={applicationId ? "Edit loan application" : "New loan application"}
        description="Five steps. The application stays editable until the first approval."
      />

      <section
        data-testid="wizard-steps"
        className="rounded-[var(--card-radius)] border border-card-border bg-surface py-[14px] px-[20px]"
      >
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-3">
          {STEPS.map((item, index) => {
            const complete = index < step;
            const current = index === step;
            return (
              <li key={item.key} className="flex items-center gap-3">
                <button
                  type="button"
                  data-testid={`wizard-step-${item.key}`}
                  aria-current={current ? "step" : undefined}
                  onClick={() => {
                    if (index > step) {
                      const failure = validateStep(step);
                      if (failure) {
                        setStepError(failure);
                        return;
                      }
                    }
                    setStepError(null);
                    setStep(index);
                  }}
                  className={[
                    "flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 fs-text outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
                    current ? "bg-primary text-on-primary" : "text-body hover:bg-subtle",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid size-6 place-items-center rounded-full fs-text font-semibold",
                      current
                        ? "bg-surface/20 text-on-primary"
                        : complete
                          ? "bg-primary/10 text-primary"
                          : "bg-subtle text-muted-foreground",
                    ].join(" ")}
                  >
                    {complete ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
                  </span>
                  <span className={current ? "font-semibold" : ""}>{item.label}</span>
                </button>
                {index < STEPS.length - 1 ? (
                  <span aria-hidden="true" className="hidden h-px w-6 bg-chrome sm:block" />
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      {optionsError ? (
        <FormError message={optionsError} />
      ) : null}

      <form
        className="space-y-5 rounded-[var(--card-radius)] border border-card-border bg-surface py-[18px] px-[20px]"
        onSubmit={(event) => {
          event.preventDefault();
          if (step === STEPS.length - 1) void submit("SUBMITTED");
          else goNext();
        }}
      >
        {step === 0 ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-client-search">
                  Client
                </label>
                {selectedClient ? (
                  <div className="flex items-center justify-between gap-3 rounded-[6px] border border-[#dee2e6] bg-[#f8fafc] px-[12px] py-[8px]">
                    <span className="flex min-w-0 items-center gap-2 fs-text text-strong">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#29aae3] fs-text font-bold text-white">
                        {selectedClient.fullName.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">
                        {selectedClient.fullName}
                        <span className="ml-2 text-muted-foreground">{selectedClient.referenceNo}</span>
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setClientId("");
                        setClientQuery("");
                        setClientOpen(true);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="la-client-search"
                      value={clientQuery}
                      onChange={(event) => {
                        setClientQuery(event.target.value);
                        setClientOpen(true);
                      }}
                      onFocus={() => setClientOpen(true)}
                      placeholder="Search by client name or member ID"
                      autoComplete="off"
                      className="h-[var(--control-height)] pl-9"
                    />
                    {clientOpen ? (
                      <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-[var(--control-radius)] border border-card-border bg-surface shadow-md">
                        {clientLoading ? (
                          <p className="px-3 py-2 fs-text text-muted-foreground">Searching…</p>
                        ) : clients.length === 0 ? (
                          <p className="px-3 py-2 fs-text text-muted-foreground">No client matches.</p>
                        ) : (
                          <ul role="listbox" aria-label="Clients">
                            {clients.map((client) => (
                              <li key={client.id}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={client.id === clientId}
                                  onClick={() => {
                                    setClientId(client.id);
                                    setClientOpen(false);
                                    setStepError(null);
                                  }}
                                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left fs-text text-body transition-colors hover:bg-subtle"
                                >
                                  <span className="truncate">{client.fullName}</span>
                                  <span className="shrink-0 text-muted-foreground">{client.referenceNo}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-product">
                  Loan product
                </label>
                <select
                  id="la-product"
                  value={productId}
                  onChange={(event) => chooseProduct(event.target.value)}
                  className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </option>
                  ))}
                </select>
                {selectedProduct ? (
                  <p className="mt-1 fs-text text-muted-foreground">
                    {formatTzs(selectedProduct.minPrincipalMinor)} – {formatTzs(selectedProduct.maxPrincipalMinor)}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-principal">
                  Principal (TZS)
                </label>
                <Input
                  id="la-principal"
                  value={principal}
                  onChange={(event) => setPrincipal(event.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                  className="h-[var(--control-height)]"
                />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-tenure">
                  Tenure
                </label>
                <div className="grid items-center gap-2" style={{ gridTemplateColumns: "minmax(0, 1fr) 110px" }}>
                  <Input
                    id="la-tenure"
                    value={tenure}
                    onChange={(event) => setTenure(event.target.value)}
                    inputMode="numeric"
                    className="h-[var(--control-height)]"
                  />
                  <select
                    aria-label="Tenure period"
                    value={tenurePeriod}
                    onChange={(event) => setTenurePeriod(event.target.value as LoanTenurePeriod)}
                    className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                  >
                    {TENURE_PERIODS.map((period) => (
                      <option key={period.value} value={period.value}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-grace">
                  Grace period (months)
                </label>
                <Input
                  id="la-grace"
                  value={gracePeriod}
                  onChange={(event) => setGracePeriod(event.target.value)}
                  inputMode="numeric"
                  className="h-[var(--control-height)]"
                />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-rate">
                  Interest rate (% per month)
                </label>
                <Input
                  id="la-rate"
                  value={interestRate}
                  onChange={(event) => setInterestRate(event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="h-[var(--control-height)]"
                />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-method">
                  Interest calculation method
                </label>
                <select
                  id="la-method"
                  value={interestMethod}
                  onChange={(event) => setInterestMethod(event.target.value as LoanInterestMethod)}
                  className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                >
                  {INTEREST_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-start">
                  Installment start date
                </label>
                <Input
                  id="la-start"
                  type="date"
                  value={installmentStartDate}
                  onChange={(event) => setInstallmentStartDate(event.target.value)}
                  className="h-[var(--control-height)]"
                />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-officer">
                  Loan officer
                </label>
                <select
                  id="la-officer"
                  value={loanOfficerId}
                  onChange={(event) => setLoanOfficerId(event.target.value)}
                  className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                >
                  <option value="">{loadingOptions ? "Loading…" : "Select officer"}</option>
                  {officers.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-capacity">
                  Debt capacity (TZS)
                </label>
                <Input
                  id="la-capacity"
                  value={debtCapacity}
                  onChange={(event) => setDebtCapacity(event.target.value)}
                  inputMode="decimal"
                  placeholder="Optional"
                  className="h-[var(--control-height)]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-sector">
                  Economic sector
                </label>
                <select
                  id="la-sector"
                  value={economicSector}
                  onChange={(event) => {
                    setEconomicSector(event.target.value);
                    setSubEconomicSector("");
                    setSubSubEconomicSector("");
                  }}
                  className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                >
                  <option value="">Select sector</option>
                  {sectors.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-sub-sector">
                  Sub-economic sector
                </label>
                <select
                  id="la-sub-sector"
                  value={subEconomicSector}
                  onChange={(event) => {
                    setSubEconomicSector(event.target.value);
                    setSubSubEconomicSector("");
                  }}
                  disabled={!sector}
                  className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text disabled:opacity-50"
                >
                  <option value="">{sector ? "Select sub-sector" : "Choose a sector first"}</option>
                  {sector?.children.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-sub-sub-sector">
                  Sub-sub economic sector
                </label>
                <select
                  id="la-sub-sub-sector"
                  value={subSubEconomicSector}
                  onChange={(event) => setSubSubEconomicSector(event.target.value)}
                  disabled={!subSector}
                  className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text disabled:opacity-50"
                >
                  <option value="">{subSector ? "Select sub-sub sector" : "Choose a sub-sector first"}</option>
                  {subSector?.children.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 fs-text text-strong">
              <input
                type="checkbox"
                checked={interestOnGrace}
                onChange={(event) => setInterestOnGrace(event.target.checked)}
              />
              Charge interest during the grace period
            </label>

            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-description">
                Description
              </label>
              <Textarea
                id="la-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Optional note about this request"
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-purpose">
                  Purpose
                </label>
                <select
                  id="la-purpose"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                >
                  <option value="">Select purpose</option>
                  {PURPOSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-disbursement">
                  Disbursement preference
                </label>
                <select
                  id="la-disbursement"
                  value={disbursementPreference}
                  onChange={(event) => setDisbursementPreference(event.target.value)}
                  className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                >
                  <option value="Cash at branch">Cash at branch</option>
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="Mobile money">Mobile money</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <label className="flex items-center gap-2 fs-text text-strong">
                <input
                  type="checkbox"
                  checked={hasGuarantor}
                  onChange={(event) => setHasGuarantor(event.target.checked)}
                />
                A guarantor will pledge savings for this loan
              </label>
              <label className="flex items-center gap-2 fs-text text-strong">
                <input
                  type="checkbox"
                  checked={hasCollateral}
                  onChange={(event) => setHasCollateral(event.target.checked)}
                />
                Collateral is offered for this loan
              </label>
            </div>

            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-remarks">
                Remarks
              </label>
              <Textarea
                id="la-remarks"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                rows={3}
                placeholder="Anything the credit officer should know"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <p className="fs-text text-muted-foreground">
              Optional. Record one next of kin for this application. Leave blank when the client has not
              nominated anyone.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-nominee-name">
                  Full name
                </label>
                <Input
                  id="la-nominee-name"
                  value={nomineeName}
                  onChange={(event) => setNomineeName(event.target.value)}
                  className="h-[var(--control-height)]"
                />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-nominee-relation">
                  Relationship
                </label>
                <select
                  id="la-nominee-relation"
                  value={nomineeRelation}
                  onChange={(event) => setNomineeRelation(event.target.value)}
                  className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                >
                  <option value="">Select relationship</option>
                  {RELATIONS.map((relation) => (
                    <option key={relation} value={relation}>
                      {relation}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-nominee-phone">
                  Phone number
                </label>
                <Input
                  id="la-nominee-phone"
                  value={nomineePhone}
                  onChange={(event) => setNomineePhone(event.target.value)}
                  inputMode="tel"
                  className="h-[var(--control-height)]"
                />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-nominee-id">
                  National ID number
                </label>
                <Input
                  id="la-nominee-id"
                  value={nomineeIdNumber}
                  onChange={(event) => setNomineeIdNumber(event.target.value)}
                  className="h-[var(--control-height)]"
                />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-nominee-percent">
                  Share (%)
                </label>
                <Input
                  id="la-nominee-percent"
                  value={nomineePercentage}
                  onChange={(event) => setNomineePercentage(event.target.value)}
                  inputMode="numeric"
                  placeholder="100"
                  className="h-[var(--control-height)]"
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 block fs-text font-medium text-body">Destination</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { value: "CASH", label: "Cash at branch" },
                    { value: "BANK", label: "Bank account" },
                    { value: "MNO", label: "Mobile money wallet" },
                  ] as { value: PaymentDestination; label: string }[]
                ).map((option) => (
                  <label
                    key={option.value}
                    className={[
                      "flex cursor-pointer items-center gap-2 rounded-[var(--control-radius)] border px-[var(--space-12)] py-2 fs-text",
                      paymentDestination === option.value
                        ? "border-primary bg-primary/5 text-strong"
                        : "border-input text-body",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="payment-destination"
                      value={option.value}
                      checked={paymentDestination === option.value}
                      onChange={() => setPaymentDestination(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {paymentDestination === "BANK" ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-bank">
                    Bank
                  </label>
                  <select
                    id="la-bank"
                    value={bankName}
                    onChange={(event) => setBankName(event.target.value)}
                    className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                  >
                    <option value="">Select bank</option>
                    {BANKS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-bank-name">
                    Account name
                  </label>
                  <Input
                    id="la-bank-name"
                    value={bankAccountName}
                    onChange={(event) => setBankAccountName(event.target.value)}
                    className="h-[var(--control-height)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-bank-number">
                    Account number
                  </label>
                  <Input
                    id="la-bank-number"
                    value={bankAccountNumber}
                    onChange={(event) => setBankAccountNumber(event.target.value)}
                    inputMode="numeric"
                    className="h-[var(--control-height)]"
                  />
                </div>
              </div>
            ) : null}

            {paymentDestination === "MNO" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-wallet-provider">
                    Provider
                  </label>
                  <select
                    id="la-wallet-provider"
                    value={mnoProvider}
                    onChange={(event) => setMnoProvider(event.target.value)}
                    className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                  >
                    <option value="">Select provider</option>
                    {WALLETS.map((wallet) => (
                      <option key={wallet} value={wallet}>
                        {wallet}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-wallet-number">
                    Wallet number
                  </label>
                  <Input
                    id="la-wallet-number"
                    value={mnoWalletNumber}
                    onChange={(event) => setMnoWalletNumber(event.target.value)}
                    inputMode="tel"
                    className="h-[var(--control-height)]"
                  />
                </div>
              </div>
            ) : null}

            {paymentDestination === "CASH" ? (
              <p className="fs-text text-muted-foreground">
                The client collects the loan in cash at the branch. The teller records the disbursement in
                the transaction module.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-5">
            <div>
              <p className="fs-text font-medium text-body">Attachments</p>
              <p className="mt-1 fs-text text-muted-foreground">
                PDF, PNG or JPEG, up to 2 MB each. Attach at most five.
              </p>
              <label
                htmlFor="la-documents"
                className="mt-3 flex cursor-pointer items-center gap-2 rounded-[var(--control-radius)] border border-dashed border-input px-[var(--space-16)] py-4 fs-text text-body transition-colors hover:bg-subtle"
              >
                <Paperclip className="size-4 text-muted-foreground" aria-hidden="true" />
                Choose files
              </label>
              <input
                id="la-documents"
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                multiple
                className="sr-only"
                onChange={(event) => {
                  void addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>

            {attachments.length ? (
              <ul className="divide-y divide-card-border rounded-[var(--control-radius)] border border-card-border">
                {attachments.map((attachment) => (
                  <li key={attachment.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate fs-text text-body">{attachment.name}</span>
                    <span className="fs-text text-muted-foreground">
                      {(attachment.sizeBytes / 1024).toFixed(0)} KB
                    </span>
                    <select
                      aria-label={`Document type for ${attachment.name}`}
                      value={attachment.kind}
                      onChange={(event) =>
                        setAttachments((current) =>
                          current.map((item) =>
                            item.id === attachment.id
                              ? { ...item, kind: event.target.value as LoanDocumentKind }
                              : item,
                          ),
                        )
                      }
                      className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
                    >
                      {DOCUMENT_KINDS.map((kind) => (
                        <option key={kind.value} value={kind.value}>
                          {kind.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      aria-label={`Remove ${attachment.name}`}
                      onClick={() =>
                        setAttachments((current) => current.filter((item) => item.id !== attachment.id))
                      }
                      className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-subtle hover:text-accent-red"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fs-text text-muted-foreground">No documents attached yet.</p>
            )}

            <div className="rounded-[var(--control-radius)] border border-card-border bg-subtle px-[var(--space-16)] py-3">
              <p className="fs-text font-medium text-body">Summary</p>
              <dl className="mt-2 grid gap-x-6 gap-y-1 fs-text sm:grid-cols-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Client</dt>
                  <dd className="text-body">{selectedClient?.fullName ?? "N/A"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Product</dt>
                  <dd className="text-body">{selectedProduct?.name ?? "N/A"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Principal</dt>
                  <dd className="tabular-nums text-body">
                    {parseMajorToMinor(principal) !== null
                      ? formatTzs((parseMajorToMinor(principal) ?? 0n).toString())
                      : "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Tenure</dt>
                  <dd className="text-body">
                    {tenure} {tenurePeriod.toLowerCase()}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Next of kin</dt>
                  <dd className="text-body">{nomineeName.trim() || "Not recorded"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Destination</dt>
                  <dd className="text-body">
                    {paymentDestination === "BANK"
                      ? `${bankName} ${bankAccountNumber}`.trim()
                      : paymentDestination === "MNO"
                        ? `${mnoProvider} ${mnoWalletNumber}`.trim()
                        : "Cash at branch"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}

        <FormError message={stepError} />
        <FormError message={saveError} />

        <div className="sticky bottom-0 -mx-[20px] -mb-[18px] flex flex-wrap items-center gap-3 border-t border-[#dee2e6] bg-white px-[20px] py-[10px] pr-[90px]">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={goBack} disabled={saving !== null}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
          ) : null}

          {step < STEPS.length - 1 ? (
            <Button
              type="submit"
              data-testid="wizard-next"
              className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold"
            >
              Next
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <>
              <Button
                type="button"
                data-testid="wizard-submit"
                disabled={saving !== null}
                aria-busy={saving === "SUBMITTED"}
                onClick={() => void submit("SUBMITTED")}
                className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold"
              >
                {saving === "SUBMITTED" ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {saving === "SUBMITTED" ? "Submitting…" : "Submit application"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving !== null}
                aria-busy={saving === "DRAFT"}
                onClick={() => void submit("DRAFT")}
                className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold"
              >
                {saving === "DRAFT" ? "Saving…" : "Save as draft"}
              </Button>
            </>
          )}

          <Button asChild variant="outline" className="ml-auto">
            <Link href="/account-loan-application">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}
