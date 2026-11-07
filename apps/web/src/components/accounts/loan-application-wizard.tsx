"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  FileText,
  LoaderCircle,
  Paperclip,
  Search,
  Trash2,
  X,
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
  { key: "additional", label: "Additional Details" },
  { key: "nominee", label: "Next of Kin" },
  { key: "payment", label: "Payment Destination" },
  { key: "documents", label: "Loan Documents" },
] as const;

const TENURE_PERIODS: { value: LoanTenurePeriod; label: string }[] = [
  { value: "MONTHS", label: "Months" },
  { value: "WEEKS", label: "Weeks" },
  { value: "DAYS", label: "Days" },
];

const INTEREST_METHODS: { value: LoanInterestMethod; label: string }[] = [
  { value: "REDUCING_BALANCE_EQUAL_INSTALLMENT", label: "Reducing Balance With Equal Installment" },
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

function tenureInDays(count: number, period: LoanTenurePeriod): number {
  if (period === "DAYS") return count;
  if (period === "WEEKS") return count * 7;
  return count * 30;
}

type ScheduleRow = {
  no: number;
  dueDate: string;
  principal: number;
  interest: number;
  amount: number;
};

function formatScheduleDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function generateSchedule(principalMajor: number, tenureCount: number, rateBp: number, startDate: string): ScheduleRow[] {
  if (!principalMajor || !tenureCount || !rateBp) return [];
  const monthlyRate = rateBp / 10000;
  const payment = (principalMajor * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -tenureCount));
  const rows: ScheduleRow[] = [];
  let balance = principalMajor;
  const start = new Date(`${startDate}T00:00:00`);
  for (let i = 1; i <= tenureCount; i += 1) {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));
    const interest = balance * monthlyRate;
    let principalPortion = payment - interest;
    let amount = payment;
    if (i === tenureCount) {
      principalPortion = balance;
      amount = principalPortion + interest;
    }
    balance = Math.max(0, balance - principalPortion);
    rows.push({
      no: i,
      dueDate: formatScheduleDate(dueDate),
      principal: principalPortion,
      interest,
      amount,
    });
  }
  // Adjust last row to reconcile rounding.
  const totalPrincipal = rows.reduce((sum, row) => sum + row.principal, 0);
  const diff = principalMajor - totalPrincipal;
  if (rows.length > 0) {
    rows[rows.length - 1].principal += diff;
    rows[rows.length - 1].amount = rows[rows.length - 1].principal + rows[rows.length - 1].interest;
  }
  return rows;
}

export function LoanApplicationWizard({
  initial,
  applicationId,
  cancelHref,
  cancelLabel = "Cancel",
}: {
  initial?: LoanApplication;
  applicationId?: string;
  cancelHref?: string;
  cancelLabel?: string;
} = {}) {
  const router = useRouter();
  const { pushToast } = useToast();

  const [step, setStep] = useState(initial ? 1 : 0);
  const [maxStep, setMaxStep] = useState(initial ? 1 : 0);
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
  const [productQuery, setProductQuery] = useState("");
  const [productOpen, setProductOpen] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<HTMLDivElement>(null);
  const [principal, setPrincipal] = useState("");
  const [tenure, setTenure] = useState("12");
  const [tenurePeriod, setTenurePeriod] = useState<LoanTenurePeriod>("MONTHS");
  const [gracePeriod, setGracePeriod] = useState("0");
  const [interestRate, setInterestRate] = useState("");
  const [interestRatePeriod, setInterestRatePeriod] = useState("Month");
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
    if (initial) return;
    const requestedClientId = new URLSearchParams(window.location.search).get("clientId");
    if (!requestedClientId) return;
    let active = true;
    void listClients({})
      .then((result) => {
        if (!active) return;
        setClients(result.items);
        const requestedClient = result.items.find((client) => client.id === requestedClientId);
        if (requestedClient) {
          setClientId(requestedClient.id);
          setClientQuery(requestedClient.fullName);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [initial]);

  useEffect(() => {
    if (!initial) return;
    const timer = window.setTimeout(() => {
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
    }, 0);
    return () => window.clearTimeout(timer);
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
    function handleClick(event: MouseEvent) {
      if (productRef.current && !productRef.current.contains(event.target as Node)) {
        setProductOpen(false);
      }
      if (clientRef.current && !clientRef.current.contains(event.target as Node)) {
        setClientOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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

  const principalMajor = Number(principal.replace(/,/g, "")) || 0;
  const schedule = useMemo(() => {
    if (!selectedProduct || !principalMajor || !tenure) return [];
    const count = Number(tenure);
    if (!Number.isInteger(count) || count < 1) return [];
    const principalMinor = parseMajorToMinor(principal);
    if (principalMinor === null || principalMinor <= 0n) return [];
    const min = BigInt(selectedProduct.minPrincipalMinor);
    const max = BigInt(selectedProduct.maxPrincipalMinor);
    if (principalMinor < min || principalMinor > max) return [];
    return generateSchedule(principalMajor, count, selectedProduct.interestRateBp, installmentStartDate);
  }, [selectedProduct, principal, tenure, installmentStartDate]);
  const subSector = sector?.children.find((item) => item.code === subEconomicSector) ?? null;

  function chooseProduct(id: string) {
    setProductId(id);
    const product = products.find((item) => item.id === id);
    if (!product) return;
    setInterestRate((product.interestRateBp / 100).toFixed(1).replace(/\.0$/, ""));
    setInterestRatePeriod(product.repaymentFrequency === "MONTHLY" ? "Month" : product.repaymentFrequency === "WEEKLY" ? "Week" : "Day");
    const method = INTEREST_METHODS.find((item) => item.value === product.interestMethod);
    if (method) setInterestMethod(method.value);
    setTenure(String(product.minTenureCount));
    setTenurePeriod(product.tenurePeriod);
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
          const requestedDays = tenureInDays(count, tenurePeriod);
          const minimumDays = tenureInDays(selectedProduct.minTenureCount, selectedProduct.tenurePeriod);
          const maximumDays = tenureInDays(selectedProduct.maxTenureCount, selectedProduct.tenurePeriod);
          if (
            requestedDays < minimumDays ||
            requestedDays > maximumDays
          ) {
            return `Tenure must fall between ${selectedProduct.minTenureCount} and ${selectedProduct.maxTenureCount} ${selectedProduct.tenurePeriod.toLowerCase()} for ${selectedProduct.name}.`;
          }
        }
        const rate = Number(interestRate);
        if (!Number.isFinite(rate) || rate < 0) return "Enter a valid interest rate.";
        const grace = Number(gracePeriod);
        if (!Number.isInteger(grace) || grace < 0 || grace > 60) {
          return "Grace period must be a whole number of months between 0 and 60.";
        }
        return null;
      }
      if (index === 1) {
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
    setMaxStep((current) => Math.max(current, step + 1));
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
        <PageHeader breadcrumb="Accounts" title="New loan application" description="Capture a client's loan request." />
        <ForbiddenPanel message="Your role cannot create loan applications. Ask an administrator for Loan Account : Create." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[26px]">
      <PageHeader
        className="min-h-[105px]"
        variant="card"
        iconPlain
        icon={<FileText className="size-[20.16px] shrink-0 text-primary" aria-hidden="true" />}
        title={applicationId ? "Update Loan Application" : "Create Loan Application"}
        titleClassName="text-[28px] font-bold leading-[normal] text-heading"
        actions={
          <Button asChild variant="ghost" size="icon" aria-label="Close">
            <Link href={cancelHref ?? "/account-loan-application"}>
              <X className="size-[20px]" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      {optionsError ? (
        <FormError message={optionsError} />
      ) : null}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (step === STEPS.length - 1) void submit("SUBMITTED");
          else goNext();
        }}
      >
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <button type="button" data-testid="wizard-step-details" aria-expanded={step === 0} aria-controls="loan-application-panel-details" onClick={() => { if (Number('0') > maxStep) return; setStepError(null); setStep(0); }} className={`flex min-h-[58px] w-full items-center justify-between px-[19px] text-left fs-text font-semibold ${step === 0 ? "bg-surface text-primary" : "bg-[#f1f1f2] text-muted-foreground"} hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50`}>
            Details <ChevronDown className={`size-5 transition-transform ${step === 0 ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        {step === 0 ? (
          <div id="loan-application-panel-details" className="space-y-5 border-t border-card-border px-[19px] py-[18px]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-client-search">
                  Client/Member *
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
                  <div className="relative" ref={clientRef}>
                    <Input
                      id="la-client-search"
                      value={clientQuery}
                      onChange={(event) => {
                        setClientQuery(event.target.value);
                        setClientOpen(true);
                      }}
                      onFocus={() => setClientOpen(true)}
                      placeholder="Search..."
                      autoComplete="off"
                      aria-required="true"
                      className="h-[var(--control-height)]"
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
                  Product *
                </label>
                <div className="relative" ref={productRef}>
                  <Input
                    id="la-product"
                    value={productQuery || (selectedProduct ? selectedProduct.name.toUpperCase() : "")}
                    onChange={(event) => {
                      setProductQuery(event.target.value);
                      setProductOpen(true);
                      if (!event.target.value) setProductId("");
                    }}
                    onFocus={() => setProductOpen(true)}
                    placeholder={loadingOptions ? "Loading products…" : "Search..."}
                    className="h-[var(--control-height)]"
                  />
                  {productOpen ? (
                    <div className="absolute z-10 mt-1 max-h-[240px] w-full overflow-y-auto rounded-[var(--control-radius)] border border-card-border bg-surface shadow-lg">
                      {products
                        .filter((product) =>
                          `${product.name} ${product.code}`.toLowerCase().includes(productQuery.trim().toLowerCase()),
                        )
                        .map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="block w-full px-[var(--space-12)] py-[var(--space-8)] text-left fs-text hover:bg-subtle"
                            onClick={() => {
                              setProductId(product.id);
                              setProductQuery(product.name.toUpperCase());
                              setProductOpen(false);
                              chooseProduct(product.id);
                            }}
                          >
                            {product.name.toUpperCase()}
                          </button>
                        ))}
                      {products.filter((product) =>
                        `${product.name} ${product.code}`.toLowerCase().includes(productQuery.trim().toLowerCase()),
                      ).length === 0 ? (
                        <p className="px-[var(--space-12)] py-[var(--space-8)] fs-text text-muted-foreground">No options</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {selectedProduct ? (
                  <p className="mt-1 fs-text text-muted-foreground">
                    {formatTzs(selectedProduct.minPrincipalMinor)} – {formatTzs(selectedProduct.maxPrincipalMinor)} · {selectedProduct.interestRateBp / 100}% per month · {selectedProduct.tenurePeriod.toLowerCase()} {selectedProduct.minTenureCount}–{selectedProduct.maxTenureCount}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-principal">
                  Principal Amount (TSh)
                </label>
                <Input
                  id="la-principal"
                  value={principal}
                  onChange={(event) => setPrincipal(event.target.value)}
                  inputMode="decimal"
                  placeholder="Enter Principal Amount"
                  className="h-[var(--control-height)]"
                />
                {selectedProduct ? (
                  <p className="mt-1 fs-text text-muted-foreground">
                    Max range: {selectedProduct.maxPrincipalMinor}, Min range: {selectedProduct.minPrincipalMinor}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-tenure">
                  Tenure
                </label>
                <div className="flex items-stretch overflow-hidden rounded-[var(--control-radius)] border border-input">
                  <Input
                    id="la-tenure"
                    value={tenure}
                    onChange={(event) => setTenure(event.target.value)}
                    inputMode="numeric"
                    className="h-[var(--control-height)] w-[60%] rounded-none border-0"
                  />
                  <div className="w-px bg-border" />
                  <select
                    aria-label="Tenure period"
                    value={tenurePeriod}
                    onChange={(event) => setTenurePeriod(event.target.value as LoanTenurePeriod)}
                    className="h-[var(--control-height)] w-[40%] rounded-none border-0 bg-background px-[var(--space-12)] fs-text"
                  >
                    {TENURE_PERIODS.map((period) => (
                      <option key={period.value} value={period.value}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedProduct ? (
                  <p className="mt-1 fs-text text-muted-foreground">
                    Max range: {selectedProduct.maxTenureCount}, Min range: {selectedProduct.minTenureCount}
                  </p>
                ) : null}
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
                  Interest Rate *
                </label>
                <div className="flex items-stretch overflow-hidden rounded-[var(--control-radius)] border border-input">
                  <Input
                    id="la-rate"
                    value={selectedProduct ? `${interestRate}%` : interestRate}
                    onChange={(event) => setInterestRate(event.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                    className={selectedProduct ? "h-[var(--control-height)] w-[60%] rounded-none border-0 bg-[#e2e8f0] text-muted-foreground" : "h-[var(--control-height)] w-[60%] rounded-none border-0"}
                    disabled={Boolean(selectedProduct)}
                  />
                  <div className="w-px bg-border" />
                  <select
                    aria-label="Interest rate period"
                    value={interestRatePeriod}
                    onChange={(event) => setInterestRatePeriod(event.target.value)}
                    className={selectedProduct ? "h-[var(--control-height)] w-[40%] rounded-none border-0 bg-[#e2e8f0] px-[var(--space-12)] fs-text text-muted-foreground" : "h-[var(--control-height)] w-[40%] rounded-none border-0 bg-background px-[var(--space-12)] fs-text"}
                    disabled={Boolean(selectedProduct)}
                  >
                    <option value="Month">Month</option>
                    <option value="Quota">Quota</option>
                    <option value="Year">Year</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-method">
                  Interest Calculation Method *
                </label>
                <select
                  id="la-method"
                  value={interestMethod}
                  onChange={(event) => setInterestMethod(event.target.value as LoanInterestMethod)}
                  className={selectedProduct ? "h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-[#e2e8f0] px-[var(--space-12)] fs-text text-muted-foreground" : "h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"}
                  disabled={Boolean(selectedProduct)}
                >
                  {INTEREST_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="la-interest-on-grace">
                Interest On Grace Period
              </label>
              <select
                id="la-interest-on-grace"
                value={interestOnGrace ? "True" : "False"}
                onChange={(event) => setInterestOnGrace(event.target.value === "True")}
                className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
              >
                <option value="False">False</option>
                <option value="True">True</option>
              </select>
            </div>

            {schedule.length > 0 ? (
              <div className="max-h-[470px] overflow-y-auto rounded-[var(--card-radius)] border border-card-border bg-subtle p-[var(--space-12)]">
                <table className="w-full text-left fs-text">
                  <thead className="sticky top-0 z-10 border-b border-card-border bg-subtle font-semibold text-strong">
                    <tr>
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Due Date</th>
                      <th className="px-3 py-2.5 text-right">Principal (TSh)</th>
                      <th className="px-3 py-2.5 text-right">Interest (TSh)</th>
                      <th className="px-3 py-2.5 text-right font-bold">Amount (TSh)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row: ScheduleRow) => (
                      <tr key={row.no} className="border-b border-card-border last:border-0" style={{ height: "55px" }}>
                        <td className="px-3 py-2.5">{row.no}</td>
                        <td className="px-3 py-2.5">{row.dueDate}</td>
                        <td className="px-3 py-2.5 text-right">{formatTzs(String(Math.round(row.principal * 100)))}</td>
                        <td className="px-3 py-2.5 text-right">{formatTzs(String(Math.round(row.interest * 100)))}</td>
                        <td className="px-3 py-2.5 text-right font-bold">{formatTzs(String(Math.round(row.amount * 100)))}</td>
                      </tr>
                    ))}
                    <tr className="bg-subtle font-bold">
                      <td className="px-3 py-2.5">Total</td>
                      <td className="px-3 py-2.5">—</td>
                      <td className="px-3 py-2.5 text-right">{formatTzs(String(Math.round(schedule.reduce((s: number, r: ScheduleRow) => s + r.principal, 0) * 100)))}</td>
                      <td className="px-3 py-2.5 text-right">{formatTzs(String(Math.round(schedule.reduce((s: number, r: ScheduleRow) => s + r.interest, 0) * 100)))}</td>
                      <td className="px-3 py-2.5 text-right">{formatTzs(String(Math.round(schedule.reduce((s: number, r: ScheduleRow) => s + r.amount, 0) * 100)))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-[100px] items-center rounded-[var(--card-radius)] border border-card-border bg-subtle px-[var(--space-16)]">
                <span className="fs-text text-muted-foreground">Check payment schedule</span>
              </div>
            )}

            <div className="flex justify-end border-t border-card-border pt-3">
              <Button
                type="submit"
                data-testid="wizard-next"
                disabled={Boolean(validateStep(0))}
                className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold"
              >
                Next
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>


          </div>
          </div>
        ) : null}
        </section>

        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <button type="button" data-testid="wizard-step-additional" aria-expanded={step === 1} aria-controls="loan-application-panel-additional" onClick={() => { if (Number('1') > maxStep) return; setStepError(null); setStep(1); }} className={`flex min-h-[58px] w-full items-center justify-between px-[19px] text-left fs-text font-semibold ${step === 1 ? "bg-surface text-primary" : "bg-[#f1f1f2] text-muted-foreground"} hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50`}>
            Additional Details <ChevronDown className={`size-5 transition-transform ${step === 1 ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        {step === 1 ? (
          <div id="loan-application-panel-additional" className="space-y-5 border-t border-card-border px-[19px] py-[18px]">
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

            <div className="grid gap-4 md:grid-cols-3">
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
                  Loan Officer *
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
                  Economic Sector *
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
          </div>
        ) : null}
        </section>

        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <button type="button" data-testid="wizard-step-nominee" aria-expanded={step === 2} aria-controls="loan-application-panel-nominee" onClick={() => { if (Number('2') > maxStep) return; setStepError(null); setStep(2); }} className={`flex min-h-[58px] w-full items-center justify-between px-[19px] text-left fs-text font-semibold ${step === 2 ? "bg-surface text-primary" : "bg-[#f1f1f2] text-muted-foreground"} hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50`}>
            Next of Kin <ChevronDown className={`size-5 transition-transform ${step === 2 ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        {step === 2 ? (
          <div id="loan-application-panel-nominee" className="space-y-5 border-t border-card-border px-[19px] py-[18px]">
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
          </div>
        ) : null}
        </section>

        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <button type="button" data-testid="wizard-step-payment" aria-expanded={step === 3} aria-controls="loan-application-panel-payment" onClick={() => { if (Number('3') > maxStep) return; setStepError(null); setStep(3); }} className={`flex min-h-[58px] w-full items-center justify-between px-[19px] text-left fs-text font-semibold ${step === 3 ? "bg-surface text-primary" : "bg-[#f1f1f2] text-muted-foreground"} hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50`}>
            Payment Destination <ChevronDown className={`size-5 transition-transform ${step === 3 ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        {step === 3 ? (
          <div id="loan-application-panel-payment" className="space-y-5 border-t border-card-border px-[19px] py-[18px]">
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
          </div>
        ) : null}
        </section>

        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <button type="button" data-testid="wizard-step-documents" aria-expanded={step === 4} aria-controls="loan-application-panel-documents" onClick={() => { if (Number('4') > maxStep) return; setStepError(null); setStep(4); }} className={`flex min-h-[58px] w-full items-center justify-between px-[19px] text-left fs-text font-semibold ${step === 4 ? "bg-surface text-primary" : "bg-[#f1f1f2] text-muted-foreground"} hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50`}>
            Loan Documents <ChevronDown className={`size-5 transition-transform ${step === 4 ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        {step === 4 ? (
          <div id="loan-application-panel-documents" className="space-y-5 border-t border-card-border px-[19px] py-[18px]">
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
          </div>
        ) : null}
        </section>

        <FormError message={stepError} />
        <FormError message={saveError} />

        {step > 0 ? <div className="flex flex-wrap items-center gap-3 border-t border-card-border bg-surface px-[19px] py-[10px] pr-[90px]">
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

        </div> : null}
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
