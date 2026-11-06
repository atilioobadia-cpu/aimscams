"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  Banknote,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock3,
  Download,
  Edit2,
  Eye,
  FilePenLine,
  Inbox,
  LogOut,
  PiggyBank,
  Printer,
  Plus,
  Repeat,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UserX,
  Wallet,
} from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu } from "@/components/data/row-actions-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/ui/search-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { clientKycDocumentUrl, getClient, listClientKycDocuments, listLoanApplications, listLoans, listMembershipPolicies, listSavingsAccounts, updateClient, uploadClientKycDocument, type Client, type ClientKycDocument, type Loan, type LoanApplication, type MembershipPolicy, type SavingsAccount } from "@/lib/settings";
import { maskEmail, titleCase } from "@/lib/privacy";
import { cn } from "cn";

const profileTabs = [
  { label: "Summary", value: "summary" },
  { label: "Users", value: "users" },
  { label: "Accounts", value: "accounts" },
  { label: "Charges", value: "charges" },
  { label: "Residence", value: "residence" },
  { label: "KYC", value: "kyc" },
  { label: "Income", value: "income" },
  { label: "Assets", value: "assets" },
  { label: "Bank", value: "bank" },
  { label: "Verification History", value: "verification-history" },
  { label: "Statement", value: "statement" },
  { label: "History", value: "history" },
] as const;

function profileTabFromParam(value: string | null): string {
  if (!value) return "summary";
  const index = Number(value);
  return Number.isInteger(index) && index > 0 && index < profileTabs.length
    ? profileTabs[index].value
    : "summary";
}

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return "N/A";
}

function SectionCard({ title, icon: Icon, children, editHref }: { title: string; icon: typeof Building2; children: React.ReactNode; editHref?: string }) {
  return (
    <section className="border-t border-[#e2e6f0] px-[13.44px] py-[13.44px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-primary" aria-hidden="true" />
          <h3 className="text-[15.12px] font-semibold leading-tight text-[#495057]">{title}</h3>
        </div>
        {editHref ? <Link href={editHref} aria-label={"Edit " + title} className="grid h-[31px] w-[37px] place-items-center rounded-[5px] border border-primary text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><Edit2 className="size-4" aria-hidden="true" /></Link> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-[2px] py-[6px]">
      <dt className="text-[13.44px] font-normal leading-[1.4] text-muted-foreground">{label}</dt>
      <dd className="break-words text-[13.44px] font-normal leading-[1.4] text-[#495057]">{value}</dd>
    </div>
  );
}
function EmptyTable({ columns, message: emptyMessage, icon: Icon = Building2 }: { columns: string[]; message: string; icon?: typeof Building2 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-[13.44px]">
        <thead className="bg-[#f8fafc]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-[10.08px] py-[10.08px] text-[13.44px] font-bold text-[#495057]">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="px-4 py-10 text-center">
              <Icon className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden="true" />
              <p className="fs-text text-muted-foreground">{emptyMessage}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TabTable({ columns, rows, emptyMessage, emptyHeight, minTableWidth = 720 }: { columns: string[]; rows: React.ReactNode[][]; emptyMessage: string; emptyHeight?: number; minTableWidth?: number }) {
  return (
    <div className="table-scroll overflow-x-auto bg-white">
      <table className="w-full text-left text-[13.44px]" style={{ minWidth: minTableWidth }}>
        <thead className="bg-[#f1f5f9]">
          <tr>
            {columns.map((column, index) => (
              <th key={column} className={cn("whitespace-nowrap px-4 py-[10.08px] text-[13.44px] font-bold text-[#495057]", column === "Actions" && index === columns.length - 1 && "w-[64px] px-2 text-center")}>
                {column === "Actions" && index === columns.length - 1 ? (
                  <button type="button" aria-label="Column settings" className="inline-grid size-8 place-items-center rounded text-[#495057] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <SlidersHorizontal className="size-4" aria-hidden="true" />
                  </button>
                ) : column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center" style={emptyHeight ? { height: emptyHeight } : undefined}>
                <Inbox className="mx-auto mb-2 size-10 text-muted-foreground" aria-hidden="true" />
                <p className="text-[13.44px] text-muted-foreground">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="bg-[#f8fafc]">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="whitespace-nowrap border-t border-[#e2e8f0] px-4 py-[14px] text-[#495057]">{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

type ClientRecordKind = "charge" | "residence" | "kyc" | "income" | "asset" | "bank";
type RecordField = { key: string; label: string; type?: "text" | "date" | "number" | "textarea" | "select" | "bank-select"; required?: boolean; requiredWhen?: { field: string; value: string }; visibleWhen?: { field: string; value: string }; options?: string[] };

const bankOptions = [
  "ABSA BANK",
  "ACCESS BANK",
  "AFRICAN BANKING COOPERATION",
  "AKIBA BANK LTD",
  "AMANA BANK",
  "AZANIA BANKCORP LIMITED",
  "BANK OF AFRICA",
  "BANK OF BARODA",
  "BANK OF BARODA (TANZANIA) LIMITED",
  "BANK OF INDIA",
  "BANK OF TANZANIA",
  "BARCLAYS BANK TANZANIA",
  "BRAC BANK UGANDA",
  "CAIRO INTERNATIONAL BANK",
  "CANARA BANK",
  "CENTENARY RURAL DEVELOPMENT",
  "CHINA DASHENG BANK LIMITED",
  "CITIBANK",
  "COMMERCIAL BANK OF AFRICA",
  "COMMERCIAL BANK OF CHINA",
  "COOPERATIVE BANK OF KENYA",
  "CRDB BANK LIMITED",
  "DAR ES SALAAM COMMUNITY BANK",
  "DFCU BANK",
  "DIAMOND TRUST BANK",
  "ECO BANK TANZANIA LTD",
  "EQUITY BANK",
  "EQUITY BANK TANZANIA",
  "EXIM BANK",
  "FAMILY BANK",
  "FINANCE TRUST BANK",
  "FIRST NATIONAL BANK TANZANIA",
  "GLOBAL TRUST BANK",
  "GT BANK (T) LTD",
  "GUARDIAN BANK LIMITED",
  "HABIB AFRICAN LTD",
  "HOUSING FINANCE",
  "I & M BANK",
  "INTERNATIONAL COMMERCIAL BANK (TANZANIA) LTD",
  "KENYA COMMERCIAL BANK",
  "KILIMANJARO COOPERATIVE BANK",
  "KINGDOM BANK",
  "MAENDELEO BANK PLC",
  "MKOMBOZI BANK",
  "MWALIMU COMMERCIAL BANK",
  "MWANGA COMMUNITY BANK",
  "NATIONAL BANK OF KENYA",
  "NATIONAL MICROFINANCE BANK",
  "NBC BANK LIMITED",
  "NCBA BANK KENYA PLC",
  "NCBA BANK UGANDA LIMITED",
  "NIC BANK",
  "OPPORTUNITY BANK",
  "PEOPLE BANK OF ZANZIBAR",
  "POST BANK KENYA",
  "POST BANK UGANDA LTD",
  "PRIDE MICROFINANCE LTD",
  "SELCOM MICROFINANCE BANK TANZANIA LIMITED",
  "STANBIC BANK",
  "STANDARD CHARTERED",
  "TANZANIA INVESTMENTS BANK",
  "TOP FINANCE BANK",
  "TPB BANK PLC",
  "TROPICAL AFRICA BANK",
  "UBL BANK (TANZANIA) LTD",
  "UCHUMI BANK LTD",
  "UGAFODE MICRO FINANCE",
  "UNITED BANK FOR AFRICA",
].map((label) => ({ id: label, label }));

const recordDefinitions: Record<ClientRecordKind, { title: string; section: string; fields: RecordField[] }> = {
  charge: { title: "Add Charge", section: "charges", fields: [
    { key: "chargeType", label: "Charge Type", required: true },
    { key: "dueDate", label: "Due Date", type: "date" },
    { key: "amount", label: "Amount (TSh)", type: "number", required: true },
  ] },
  residence: { title: "Add Residence", section: "residenceRecords", fields: [
    { key: "houseNumber", label: "House Number" },
    { key: "addressLine1", label: "Address Line 1", required: true },
    { key: "addressLine2", label: "Address Line 2" },
    { key: "addressLine3", label: "Address Line 3" },
    { key: "areaWard", label: "Area / Ward" },
    { key: "districtCity", label: "District / City" },
    { key: "regionState", label: "Region / State" },
    { key: "country", label: "Country" },
    { key: "postalCode", label: "Pincode / Zip" },
  ] },
  kyc: { title: "Add KYC Record", section: "kycRecords", fields: [
    { key: "documentType", label: "Document Type", type: "select", required: true, options: [
      "Affidavit", "Bank Statement", "Birth Certificate", "Cancelled Cheque", "Driving License", "Identity",
      "KRA Pin Certificate", "Logo", "Military ID", "National ID", "Nida Id", "Others",
    ] },
    { key: "comments", label: "Comments", type: "textarea" },
  ] },
  income: { title: "Add Income", section: "incomeRecords", fields: [
    { key: "incomeSource", label: "Income Type", type: "select", required: true, options: ["Employment", "Business"] },
    { key: "companyName", label: "Company Name", requiredWhen: { field: "incomeSource", value: "Employment" }, visibleWhen: { field: "incomeSource", value: "Employment" } },
    { key: "companyAddress", label: "Company Address", requiredWhen: { field: "incomeSource", value: "Employment" }, visibleWhen: { field: "incomeSource", value: "Employment" } },
    { key: "monthlyIncome", label: "Income (TSh)", type: "number", requiredWhen: { field: "incomeSource", value: "Employment" }, visibleWhen: { field: "incomeSource", value: "Employment" } },
    { key: "contractType", label: "Contract Type", type: "select", options: ["Permanent", "Part-Time", "Freelance", "Internship"], requiredWhen: { field: "incomeSource", value: "Employment" }, visibleWhen: { field: "incomeSource", value: "Employment" } },
    { key: "businessAddress", label: "Business Address", requiredWhen: { field: "incomeSource", value: "Business" }, visibleWhen: { field: "incomeSource", value: "Business" } },
    { key: "registrationNumber", label: "Business Registration Number (Brela)", requiredWhen: { field: "incomeSource", value: "Business" }, visibleWhen: { field: "incomeSource", value: "Business" } },
    { key: "businessLicenseNumber", label: "Business License Number", requiredWhen: { field: "incomeSource", value: "Business" }, visibleWhen: { field: "incomeSource", value: "Business" } },
    { key: "tinNumber", label: "TIN Number", requiredWhen: { field: "incomeSource", value: "Business" }, visibleWhen: { field: "incomeSource", value: "Business" } },
    { key: "businessTurnover", label: "Business Turn Over (weekly, yearly)", requiredWhen: { field: "incomeSource", value: "Business" }, visibleWhen: { field: "incomeSource", value: "Business" } },
  ] },
  asset: { title: "Add Asset", section: "assetRecords", fields: [
    { key: "assetType", label: "Asset Type", required: true },
    { key: "value", label: "Value (TSh)", type: "number" },
    { key: "location", label: "Location" },
    { key: "notes", label: "Comments / Notes", type: "textarea" },
  ] },
  bank: { title: "Add Bank", section: "bankDetails", fields: [
    { key: "bankName", label: "Bank Name", type: "bank-select", required: true },
    { key: "accountNumber", label: "Account Number", required: true },
    { key: "bicSwiftCode", label: "BIC / Swift Code" },
    { key: "branchAddress", label: "Branch Address" },
  ] },
};

function ClientRecordDialog({
  kind,
  initialValues,
  isEditing,
  open,
  saving,
  error,
  onOpenChange,
  onSubmit,
}: {
  kind: ClientRecordKind | null;
  initialValues: Record<string, string>;
  isEditing: boolean;
  open: boolean;
  saving: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, string>, file?: File | null) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [bankError, setBankError] = useState<string | null>(null);
  const definition = kind ? recordDefinitions[kind] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {definition ? (
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <form onSubmit={(event) => {
            event.preventDefault();
            if (kind === "bank" && !values.bankName) {
              setBankError("Select a bank to continue.");
              return;
            }
            setBankError(null);
            onSubmit(values, selectedFile);
          }} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{kind === "residence" && isEditing ? "Edit Residence" : definition.title}</DialogTitle>
              <DialogDescription>{kind === "residence" ? isEditing ? "Update the current residence. The client keeps one residence record." : "Only one residence is kept for a client. Saving a new residence replaces the current one." : "Save this information to the client profile."}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {definition.fields.filter((field) => !field.visibleWhen || values[field.visibleWhen.field] === field.visibleWhen.value).map((field) => {
                const required = field.required || (field.requiredWhen !== undefined && values[field.requiredWhen.field] === field.requiredWhen.value);
                return (
                <label key={field.key} className={cn("space-y-1", field.type === "textarea" && "sm:col-span-2")}>
                  <span className="block text-[13.44px] font-medium text-[#495057]">{field.label}{required ? " *" : ""}</span>
                  {field.type === "bank-select" ? (
                    <>
                      <SearchSelect
                        id="client-bank-name"
                        options={bankOptions}
                        value={values[field.key] ?? ""}
                        placeholder="Select bank"
                        required={required}
                        invalid={Boolean(bankError)}
                        onValueChange={(value) => {
                          setValues((current) => ({ ...current, [field.key]: value }));
                          setBankError(null);
                        }}
                      />
                      {bankError ? <span role="alert" className="block text-[13.44px] text-destructive">{bankError}</span> : null}
                    </>
                  ) : field.type === "select" ? (
                    <select required={required} value={values[field.key] ?? ""} onChange={(event) => setValues((current) => field.key === "incomeSource" ? { incomeSource: event.target.value } : ({ ...current, [field.key]: event.target.value }))} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 text-[13.44px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                      <option value="" disabled>Select {field.label.toLowerCase()}</option>
                      {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea required={required} maxLength={1000} value={values[field.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} className="min-h-20 w-full rounded-[var(--control-radius)] border border-input bg-background px-3 py-2 text-[13.44px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
                  ) : (
                    <Input required={required} type={field.type ?? "text"} min={field.type === "number" ? "0" : undefined} step={field.type === "number" ? "any" : undefined} maxLength={field.type === "number" ? undefined : 1000} value={values[field.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                  )}
                </label>
              );})}
            </div>
            {kind === "kyc" ? (
              <label className="block space-y-1">
                <span className="block text-[13.44px] font-medium text-[#495057]">Select file *</span>
                <Input
                  type="file"
                  required={Boolean(values.documentType)}
                  disabled={!values.documentType}
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  aria-describedby="kyc-file-help kyc-file-error"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      event.target.value = "";
                      setSelectedFile(null);
                      setFileError("The selected file must be 5 MB or smaller.");
                      return;
                    }
                    setSelectedFile(file);
                    setFileError(null);
                  }}
                />
                <span id="kyc-file-help" className="block text-[12px] text-muted-foreground">PDF, JPG or PNG. Maximum size: 5 MB.</span>
                {fileError ? <span id="kyc-file-error" role="alert" className="block text-[13.44px] text-destructive">{fileError}</span> : null}
              </label>
            ) : null}
            {error ? <p role="alert" className="text-[13.44px] text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

export function ClientProfile({ id }: { id: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabListRef = useRef<HTMLDivElement>(null);
  const [tabOverflow, setTabOverflow] = useState({ needed: false, atEnd: false });
  const activeTab = profileTabFromParam(searchParams.get("tab"));
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [savings, setSavings] = useState<SavingsAccount[]>([]);
  const [kycDocuments, setKycDocuments] = useState<ClientKycDocument[]>([]);
  const [membershipPolicies, setMembershipPolicies] = useState<MembershipPolicy[]>([]);
  const [showAllAccounts, setShowAllAccounts] = useState(true);
  const [statementStart, setStatementStart] = useState("");
  const [statementEnd, setStatementEnd] = useState("");
  const [recordDialogKind, setRecordDialogKind] = useState<ClientRecordKind | null>(null);
  const [recordDialogInstance, setRecordDialogInstance] = useState(0);
  const [recordDialogInitialValues, setRecordDialogInitialValues] = useState<Record<string, string>>({});
  const [editingResidenceIndex, setEditingResidenceIndex] = useState<number | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const { pushToast } = useToast();

  function openRecordDialog(kind: ClientRecordKind, initialValues: Record<string, string> = {}, editIndex: number | null = null) {
    setRecordError(null);
    setRecordDialogInitialValues(initialValues);
    setEditingResidenceIndex(kind === "residence" ? editIndex : null);
    setRecordDialogInstance((current) => current + 1);
    setRecordDialogKind(kind);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const end = new Date();
      const previousMonthDays = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
      const start = new Date(end.getFullYear(), end.getMonth() - 1, Math.min(end.getDate(), previousMonthDays));
      const toDateInputValue = (date: Date) =>
        [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");

      setStatementStart((current) => current || toDateInputValue(start));
      setStatementEnd((current) => current || toDateInputValue(end));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    void getClient(id)
      .then((response) => {
        if (!active) return;
        setClient(response.client);
        setCanEdit(response.canEdit);
      })
      .catch((failure: unknown) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else if (failure instanceof ApiError && failure.status === 404) setNotFound(true);
        else setError(message(failure, "Could not load this client."));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!client) return;
    let active = true;
    void listClientKycDocuments(client.id)
      .then((response) => {
        if (active) setKycDocuments(response.items);
      })
      .catch(() => {
        if (active) setKycDocuments([]);
      });
    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    if (!client) return;
    let active = true;
    void listLoans({})
      .then((response) => {
        if (!active) return;
        setLoans(response.items.filter((loan) => loan.clientReference === client.referenceNo));
      })
      .catch(() => {
        if (!active) return;
        setLoans([]);
      });
    void listSavingsAccounts()
      .then((response) => {
        if (!active) return;
        setSavings(response.items.filter((account) => account.clientReference === client.referenceNo));
      })
      .catch(() => {
        if (!active) return;
        setSavings([]);
      });
    void listLoanApplications()
      .then((response) => {
        if (!active) return;
        setLoanApplications(response.items.filter((application) =>
          application.clientReference === client.referenceNo || application.clientId === client.id
        ));
      })
      .catch(() => {
        if (!active) return;
        setLoanApplications([]);
      });
    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    if (!client) return;
    let active = true;
    void listMembershipPolicies()
      .then((response) => {
        if (active) setMembershipPolicies(response.items);
      })
      .catch(() => {
        if (active) setMembershipPolicies([]);
      });
    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    const tabList = tabListRef.current;
    if (!tabList) return;

    const updateOverflow = () => {
      const needed = tabList.scrollWidth > tabList.clientWidth + 1;
      const atEnd = tabList.scrollLeft + tabList.clientWidth >= tabList.scrollWidth - 1;
      setTabOverflow((current) => current.needed === needed && current.atEnd === atEnd
        ? current
        : { needed, atEnd });
    };

    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(tabList);
    window.addEventListener("resize", updateOverflow);
    tabList.addEventListener("scroll", updateOverflow, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOverflow);
      tabList.removeEventListener("scroll", updateOverflow);
    };
  }, [loading, client, forbidden, notFound]);

  useEffect(() => {
    tabListRef.current
      ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activeTab, loading, client, forbidden, notFound]);

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader breadcrumb="Client" title="Client profile" description="Client details." />
        <ForbiddenPanel message="Your role cannot view clients. Ask an administrator for Client : View." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-5">
        <PageHeader title="Client profile" description="Client details." />
        <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-24)] text-center">
          <p className="fs-text font-bold text-strong">Client not found</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/clients">Back to clients</Link>
          </Button>
        </div>
      </div>
    );
  }

  const profile = objectValue(client?.profile);
  const membership = objectValue(profile.membership);
  const personal = objectValue(profile.personal);
  const identity = objectValue(profile.identity);
  const contact = objectValue(profile.contact);
  const residenceDetails = objectValue(profile.residenceDetails);
  const currentResidence = stringValue(residenceDetails.currentAddress) || stringValue(profile.residence);
  const initials = client?.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "NA";
  const editHref = canEdit && client ? `/clients/${encodeURIComponent(client.id)}/edit` : undefined;
  const profileRecords = (key: string): Record<string, unknown>[] =>
    Array.isArray(profile[key]) ? (profile[key] as unknown[]).map(objectValue) : [];
  const chargeRecords = profileRecords("charges");
  const residenceRecords = profileRecords("residenceRecords");
  const kycRecords = profileRecords("kycRecords");
  const incomeRecords = profileRecords("incomeRecords");
  const assetRecords = profileRecords("assetRecords");
  const bankRecords = profileRecords("bankDetails");

  async function saveProfileRecord(kind: ClientRecordKind, values: Record<string, string>, editIndex: number | null = null, file: File | null = null) {
    if (!client || !canEdit) return;
    setSavingRecord(true);
    setRecordError(null);
    try {
      const definition = recordDefinitions[kind];
      if (kind === "kyc") {
        if (!file) {
          setRecordError("Select a document file.");
          return;
        }
        const response = await uploadClientKycDocument(client.id, {
          documentType: values.documentType ?? "",
          comments: values.comments,
          file,
        });
        setKycDocuments((current) => [response.document, ...current]);
        setClient((current) => current ? { ...current, kycStatus: "PENDING" } : current);
        setRecordDialogKind(null);
        pushToast("KYC document uploaded.");
        return;
      }
      const existingRecords = profileRecords(definition.section);
      const previousResidence = kind === "residence" && editIndex !== null
        ? residenceRecords[editIndex]
        : undefined;
      const record: Record<string, string> = {
        ...(previousResidence ? previousResidence as Record<string, string> : {}),
        id: previousResidence ? stringValue(previousResidence.id) : crypto.randomUUID(),
        ...values,
      };
      if (kind === "charge") {
        record.creationDate = new Date().toISOString().slice(0, 10);
        record.outstandingDays = "0";
        record.outstandingAmount = values.amount ?? "0";
        record.status = "Unpaid";
      }
      if (kind === "residence" && !previousResidence) record.status = "ACTIVE";
      const recordsToSave = kind === "residence" ? [record] : [...existingRecords, record];
      const residenceAddress = ["houseNumber", "addressLine1", "addressLine2", "addressLine3", "areaWard", "districtCity", "regionState", "country", "postalCode"]
        .map((field) => record[field]?.trim())
        .filter(Boolean)
        .join(", ");
      const response = await updateClient(client.id, {
        profilePatch: {
          [definition.section]: recordsToSave,
          ...(kind === "residence" ? { residenceDetails: { currentAddress: residenceAddress, sameAsCurrent: false } } : {}),
        },
      });
      setClient(response.client);
      setRecordDialogKind(null);
      setEditingResidenceIndex(null);
      pushToast(`${definition.title.replace("Add ", "")} saved.`);
    } catch (failure) {
      setRecordError(message(failure, "Could not save the client information."));
    } finally {
      setSavingRecord(false);
    }
  }

  async function setResidenceActive(index: number, active: boolean) {
    if (!client || !canEdit) return;
    setSavingRecord(true);
    try {
      const nextRecords = residenceRecords.length
        ? residenceRecords.map((record, recordIndex) => recordIndex === index
          ? { ...record, status: active ? "ACTIVE" : "INACTIVE" }
          : record)
        : currentResidence
          ? [{ id: crypto.randomUUID(), addressLine1: currentResidence, status: active ? "ACTIVE" : "INACTIVE" }]
          : [];
      const response = await updateClient(client.id, { profilePatch: { residenceRecords: nextRecords } });
      setClient(response.client);
      pushToast(active ? "Residence activated." : "Residence deactivated.");
    } catch (failure) {
      pushToast(message(failure, "Could not update residence status."));
    } finally {
      setSavingRecord(false);
    }
  }

  async function unapproveKyc() {
    if (!client || !canEdit) return;
    if (client.kycStatus === "PENDING") {
      pushToast("KYC is already pending.");
      return;
    }
    try {
      const response = await updateClient(client.id, { kycStatus: "PENDING" });
      setClient(response.client);
      pushToast("KYC approval was removed.");
    } catch (failure) {
      pushToast(message(failure, "Could not update KYC status."));
    }
  }

  const selectedPolicy = membershipPolicies.find((policy) =>
    policy.id === membership.membershipPolicyId
    || policy.id === membership.membershipPolicy
    || policy.name === membership.membershipPolicy
  );
  const managerName = stringValue(membership.manager)
    || stringValue(membership.relationshipManagerName)
    || "N/A";
  const policyName = stringValue(membership.membershipPolicyName)
    || selectedPolicy?.name
    || "N/A";
  const quickLoanCreditLimit = numberValue(membership.quickLoanCreditLimit);
  const restrictedFromQuickLoan = typeof membership.restrictedFromQuickLoan === "boolean"
    ? (membership.restrictedFromQuickLoan ? "Yes" : "No")
    : stringValue(membership.restrictedFromQuickLoan) || "N/A";
  const visibleIfRequested = <T extends { status: string }>(items: T[]) =>
    items.filter((item) => showAllAccounts || !["CLOSED", "INACTIVE", "REJECTED", "CANCELLED"].includes(item.status));
  const accountSections = [
    {
      title: "Loan Applications",
      icon: FilePenLine,
      items: (showAllAccounts ? loanApplications : []).map((item) => ({
        id: item.id,
        reference: item.applicationNo,
        status: item.status,
        productName: item.productName || "N/A",
        amount: item.principalMinor,
        tenure: `${item.tenureCount} ${titleCase(item.tenurePeriod)}`,
        interest: null,
        kind: "application" as const,
        href: null,
      })),
    },
    {
      title: "Loans",
      icon: Banknote,
      items: visibleIfRequested(loans).map((item) => ({
        id: item.id,
        reference: item.loanNumber,
        status: item.status,
        productName: item.productName || "N/A",
        amount: item.principalMinor,
        tenure: `${item.tenureCount} ${titleCase(item.tenurePeriod)}`,
        interest: `${(item.interestRateBp / 100).toFixed(2)}% per Month`,
        kind: "loan" as const,
        href: `/account-loan-details/${encodeURIComponent(item.id)}`,
      })),
    },
    {
      title: "Savings",
      icon: PiggyBank,
      items: visibleIfRequested(savings).map((item) => ({
        id: item.id,
        reference: item.accountNumber,
        status: item.status,
        productName: item.productName || item.accountType,
        amount: item.balanceMinor,
        tenure: "",
        interest: null,
        kind: "savings" as const,
        href: null,
      })),
    },
    { title: "Shares", icon: Wallet, items: [] },
  ].filter((section) => section.items.length > 0);

  function selectProfileTab(value: string) {
    const index = profileTabs.findIndex((tab) => tab.value === value);
    if (index < 0) return;
    const nextParams = new URLSearchParams(searchParams.toString());
    if (index === 0) nextParams.delete("tab");
    else nextParams.set("tab", String(index));
    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-3 text-[13.44px] text-[#495057]">
      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={10} />
        </section>
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => window.location.reload()} />
      ) : client ? (
        <>
          <section className="flex min-h-[108px] flex-wrap items-center gap-x-6 gap-y-4 rounded-[8px] border border-[#dee2e6] bg-white px-[16px] py-[12px]">
            <div className="flex min-w-[340px] flex-1 items-center gap-[16px]">
              <div className="flex size-[80px] shrink-0 items-center justify-center rounded-full border-[3px] border-primary bg-[#e9ecef] text-[25px] font-normal text-[#6c757d]" aria-hidden="true">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[18px] font-bold leading-[1.25] text-[#212529]">{client.fullName.toUpperCase()}</h1>
                <p className="mt-[4px] text-[13.44px] leading-[1.4] text-[#495057]">Member ID: {client.memberNo ?? client.referenceNo}</p>
              </div>
            </div>
            <div className="grid min-w-[520px] flex-[1.2] grid-cols-2 gap-x-[24px] gap-y-[8px] lg:grid-cols-4">
              {[
                ["Status", titleCase(client.status)],
                ["KYC Status", titleCase(client.kycStatus)],
                ["Phone Number", client.phone || "N/A"],
                ["Type", titleCase(client.clientType)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <p className="text-[13.44px] leading-[1.35] text-[#6c757d]">{label}</p>
                  <p className="truncate text-[13.44px] leading-[1.45] text-[#212529]">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <Tabs value={activeTab} onValueChange={selectProfileTab} className="gap-0">
            <div className={cn(
              "flex h-[44.9px] w-full items-stretch bg-[#f8fafc]",
            )}>
              <TabsList ref={tabListRef} id="client-profile-tabs" variant="line" className="h-full min-w-0 flex-1 justify-start overflow-x-auto rounded-none border-0 bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {profileTabs.map(({ label: tab, value }) => (
                <TabsTrigger
                  key={tab}
                  value={value}
                  className="h-full flex-none rounded-none border-0 px-[16px] py-0 text-[13.44px] font-medium text-[#6c757d] after:bottom-0 after:h-[2px] after:bg-primary data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-primary"
                >
                  {tab}
                </TabsTrigger>
              ))}
              </TabsList>
              {tabOverflow.needed ? (
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={tabOverflow.atEnd ? "Show earlier client tabs" : "Show more client tabs"}
                  aria-controls="client-profile-tabs"
                  onClick={() => {
                    const tabList = tabListRef.current;
                    if (!tabList) return;
                    tabList.scrollTo({
                      left: tabOverflow.atEnd ? 0 : tabList.scrollLeft + tabList.clientWidth * 0.8,
                      behavior: "smooth",
                    });
                  }}
                  className="h-full w-[42px] flex-none rounded-none border-0 border-l border-[#f1f3f5] p-0 text-[#6c757d] hover:bg-[#f8fafc] hover:text-primary"
                >
                  {tabOverflow.atEnd ? <ChevronLeft className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
                </Button>
              ) : null}
            </div>

            <TabsContent value="summary" className="mt-0 space-y-[12px]">
              <div className="flex min-h-[54px] flex-wrap items-center justify-end gap-[8px] rounded-b-[8px] border-x border-b border-[#dee2e6] bg-white px-[16px] py-[8px]">
                {[
                  { label: "Transaction", icon: ArrowLeftRight, href: "/transactions" },
                  { label: "Send USSD PIN OTP", icon: Send },
                  { label: "Deactivate", icon: UserX },
                  { label: "Exit", icon: LogOut },
                ].map(({ label, icon: Icon, href }) => {
                  const className = "h-[34px] rounded-[6px] border-primary px-[12px] text-[13.44px] font-medium text-primary hover:bg-primary-tint disabled:opacity-100 disabled:text-primary";
                  const content = <><Icon className="mr-[6px] size-[14px]" aria-hidden="true" />{label}</>;
                  return href ? (
                    <Button key={label} asChild variant="outline" className={className}>
                      <Link href={href}>{content}</Link>
                    </Button>
                  ) : (
                    <Button key={label} variant="outline" disabled className={className}>{content}</Button>
                  );
                })}
              </div>

              <div className="overflow-hidden rounded-[10.08px] border border-[#dee2e6] bg-white">
                <div className="grid grid-cols-1 gap-[13.44px] p-[13.44px] lg:grid-cols-[234px_minmax(0,1fr)]">
                  <section className="rounded-[6.72px] border border-[#dee2e6] p-[13.44px]">
                    <div className="mb-[12px] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserRound className="size-5 text-primary" aria-hidden="true" />
                        <h3 className="text-[15.12px] font-semibold text-[#495057]">Profile</h3>
                      </div>
                      {editHref ? <Link href={editHref} aria-label="Edit profile" className="grid h-[31px] w-[37px] place-items-center rounded-[5px] border border-primary text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><Edit2 className="size-4" aria-hidden="true" /></Link> : null}
                    </div>
                    <div className="flex flex-col items-center gap-[8px] text-center">
                      <div className="flex size-[120px] items-center justify-center rounded-full border-[2px] border-[#dee2e6] bg-[#e9ecef] text-[28px] font-normal text-[#6c757d]" aria-hidden="true">
                        {initials}
                      </div>
                      <h3 className="text-[13.44px] font-semibold leading-[1.35] text-[#495057]">{client.fullName.toUpperCase()}</h3>
                      <p className="text-[13.44px] text-muted-foreground">Member</p>
                      <a href="#" className="rounded-[5px] bg-[#e9ecef] px-[18px] py-[8px] text-[13.44px] font-medium text-[#495057]">Signature</a>
                    </div>
                  </section>

                  <section className="rounded-[6.72px] border border-[#dee2e6] p-[13.44px]">
                    <div className="mb-[10px] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserRound className="size-5 text-primary" aria-hidden="true" />
                        <h3 className="text-[15.12px] font-semibold text-[#495057]">Membership Details</h3>
                      </div>
                      {editHref ? <Link href={editHref} aria-label="Edit membership details" className="grid h-[31px] w-[37px] place-items-center rounded-[5px] border border-primary text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><Edit2 className="size-4" aria-hidden="true" /></Link> : null}
                    </div>
                    <dl className="grid grid-cols-1 gap-x-[16px] md:grid-cols-2 xl:grid-cols-3">
                      <Field label="Member Id" value={client.memberNo ?? client.referenceNo} />
                      <Field label="Client Manager" value={managerName} />
                      <Field label="Type" value={titleCase(client.clientType)} />
                      <Field label="Reference Number" value={client.referenceNo || "N/A"} />
                      <Field label="Branch Name" value={client.branchName ?? "N/A"} />
                      <Field label="Policy" value={policyName} />
                      <Field label="Quick Loan Credit Limit" value={quickLoanCreditLimit} />
                      <Field label="Restricted from Quick Loan" value={restrictedFromQuickLoan} />
                      <Field label="Date Of Joining" value={client.joinedAt ? new Date(client.joinedAt).toLocaleDateString() : "N/A"} />
                      <Field label="Group Name" value={client.groupName ?? "N/A"} />
                    </dl>
                  </section>
                </div>

                <SectionCard title="Contact Information" icon={Building2} editHref={editHref}>
                  <dl className="grid grid-cols-1 gap-x-[18px] md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Email Address" value={maskEmail(client.email) || "N/A"} />
                    <Field label="Phone Number" value={client.phone || "N/A"} />
                    <Field label="Physical Location" value={currentResidence || "N/A"} />
                    <Field label="MNO" value={stringValue(contact.mno) || "N/A"} />
                  </dl>
                </SectionCard>

                <SectionCard title="Personal Details" icon={UserRound} editHref={editHref}>
                  <dl className="grid grid-cols-1 gap-x-[18px] md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Full Name" value={client.fullName.toUpperCase()} />
                    <Field label="Gender" value={titleCase(stringValue(personal.gender) || "N/A")} />
                    <Field label="Age" value={numberValue(personal.age)} />
                    <Field label="Nationality" value={stringValue(personal.nationality) || "N/A"} />
                    <Field label="Date Of Birth" value={stringValue(personal.dateOfBirth) ? new Date(stringValue(personal.dateOfBirth)).toLocaleDateString() : "N/A"} />
                    <Field label="Marital Status" value={titleCase(stringValue(personal.maritalStatus) || "N/A")} />
                    <Field label="Father's Name" value={stringValue(personal.fatherName) || "N/A"} />
                    <Field label="Spouse's Name" value={stringValue(personal.spouseName) || "N/A"} />
                  </dl>
                </SectionCard>

                <SectionCard title="Identity Number" icon={ShieldCheck} editHref={editHref}>
                  <dl className="grid grid-cols-1 gap-x-[18px] md:grid-cols-2">
                    <Field label="National ID Number" value={client.nationalId || "N/A"} />
                    <Field label="Tax Number" value={stringValue(identity.tin) || "N/A"} />
                  </dl>
                </SectionCard>

                <SectionCard title="Socio-Economic Data" icon={Building2} editHref={editHref}>
                  <dl className="grid grid-cols-1 gap-x-[18px] md:grid-cols-2">
                    <Field label="Person with disability (PWD)" value={titleCase(stringValue(personal.disability) || "N/A")} />
                    <Field label="Number Of Dependents" value={numberValue(personal.dependents)} />
                  </dl>
                </SectionCard>

                <SectionCard title="Standing Instructions" icon={Repeat} editHref={editHref}>
                  <EmptyTable columns={["Rule", "Product/Charge Name", "Source Product", "Source Account", "Status", "Actions"]} message="No data available" icon={Repeat} />
                </SectionCard>

                <SectionCard title="Next of Kin" icon={UserRound} editHref={editHref}>
                  <EmptyState icon={UserRound} title="No next of kin records found" description="No local next of kin records are available." />
                </SectionCard>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="min-h-[180px] rounded-b-[8px] bg-white px-[18px] pb-[18px] pt-[14px]">
                <TabTable columns={["Full Name", "Email Address", "Country code", "Phone Number", "Role", "Actions"]} rows={[]} emptyMessage="No local users available." />
              </div>
            </TabsContent>

            <TabsContent value="accounts">
              <div className="min-h-[410px] space-y-4 rounded-b-[8px] bg-white px-[18px] pb-[18px] pt-[14px]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-[10px] text-[13.44px] text-[#495057]">
                    <span>Show All</span>
                    <button
                      type="button"
                      role="switch"
                      aria-label="Show all client accounts"
                      aria-checked={showAllAccounts}
                      onClick={() => setShowAllAccounts((current) => !current)}
                      className={cn("relative h-[22px] w-[38px] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", showAllAccounts ? "bg-primary" : "bg-[#cbd5e1]")}
                    >
                      <span className={cn("absolute left-[2px] top-[2px] size-[18px] rounded-full bg-white shadow-sm transition-transform", showAllAccounts ? "translate-x-[16px]" : "translate-x-0")} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="h-[30px] rounded-[6px] !border-primary !bg-white px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint"><Link href={`/account-loan-application-create?clientId=${encodeURIComponent(client.id)}`}><Plus className="size-[14px]" aria-hidden="true" />New loan application</Link></Button>
                    <Button asChild variant="outline" className="h-[30px] rounded-[6px] !border-primary !bg-white px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint"><Link href={`/account-saving?clientId=${encodeURIComponent(client.id)}&open=1`}><Plus className="size-[14px]" aria-hidden="true" />Add saving</Link></Button>
                    <Button variant="outline" className="h-[30px] rounded-[6px] !border-primary !bg-white px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint"><Plus className="size-[14px]" aria-hidden="true" />Add share</Button>
                  </div>
                </div>

                {accountSections.map((section) => (
                  <details key={section.title} open className="group rounded-[8px] border border-[#e2e8f0] bg-[#f1f5f9] px-[18px] py-[14px]">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-[4px]">
                      <span className="flex items-center gap-2 text-[15.12px] font-semibold text-[#495057]">
                        <section.icon className="size-5 text-[#495057]" aria-hidden="true" />
                        {section.title}
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1 text-[11.76px] font-semibold text-white">{section.items.length}</span>
                      </span>
                      <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="mt-3 space-y-2">
                      {section.items.map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-[16px] py-[14px]">
                          <section.icon className="size-5 shrink-0 text-[#495057]" aria-hidden="true" />
                          <span className="min-w-[120px] flex-1 text-[13.44px] text-[#495057]">{item.reference}</span>
                          <span className={cn("rounded-full px-[10px] py-[4px] text-[11.76px] font-semibold", item.kind === "loan" ? "bg-[#dcfce7] text-[#166534]" : "bg-[#f3f4f6] text-[#495057]")}>{titleCase(item.status)}</span>
                          <div className="min-w-[210px] flex-[1.5]">
                            <p className="text-[13.44px] text-[#495057]">{item.productName}</p>
                            <p className="mt-1 text-[11.76px] text-[#6c757d]">Amount: {item.amount}{item.tenure ? ` • Tenure: ${item.tenure}` : ""}</p>
                            {item.interest ? <p className="text-[11.76px] text-[#6c757d]">Interest: {item.interest}</p> : null}
                          </div>
                          {item.href ? (
                            <Button asChild variant="link" className="ml-auto h-auto px-1 text-[11.76px] font-semibold text-[#495057]">
                              <Link href={item.href}><Eye aria-hidden="true" />View Balance</Link>
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
                {accountSections.length === 0 ? (
                  <p className="py-8 text-center text-[13.44px] text-[#6c757d]">No accounts available.</p>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="charges">
              <div className="min-h-[312px] rounded-b-[8px] bg-white px-[18px] pb-[18px] pt-[14px]">
                <div className="mb-3 flex justify-end">
                  <Button type="button" variant="outline" disabled={!canEdit} onClick={() => openRecordDialog("charge")} className="h-[30px] rounded-[6px] border-primary bg-white px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint"><Plus className="size-[14px]" aria-hidden="true" />Add Charge</Button>
                </div>
                <TabTable columns={["Charges Type", "Creation Date", "Due Date", "Outstanding Days", "Amount (TSh)", "Outstanding Amount (TSh)", "Status", "Actions"]} rows={chargeRecords.map((record) => [stringValue(record.chargeType), stringValue(record.creationDate), stringValue(record.dueDate), stringValue(record.outstandingDays), stringValue(record.amount), stringValue(record.outstandingAmount), stringValue(record.status), "—"])} emptyMessage="No data available" emptyHeight={220} />
              </div>
            </TabsContent>

            <TabsContent value="residence">
              <div className="min-h-[180px] rounded-b-[8px] bg-white px-[18px] pb-[18px] pt-[14px]">
                <div className="mb-3 flex justify-end">
                  <Button type="button" variant="outline" disabled={!canEdit} onClick={() => openRecordDialog("residence")} className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint"><Plus className="size-[14px]" aria-hidden="true" />Add Residence</Button>
                </div>
                <TabTable
                  columns={["House Number", "Address Line 1", "Address Line 2", "Address Line 3", "Area / Ward", "District / City", "Region / State", "Country", "Pincode / Zip", "Actions"]}
                  rows={residenceRecords.length
                    ? residenceRecords.map((record, index) => {
                        const active = stringValue(record.status).toUpperCase() !== "INACTIVE";
                        return [
                          ...["houseNumber", "addressLine1", "addressLine2", "addressLine3", "areaWard", "districtCity", "regionState", "country", "postalCode"].map((key) => stringValue(record[key])),
                          canEdit ? (
                            <RowActionsMenu
                              key={stringValue(record.id) || index}
                              label={`residence ${index + 1}`}
                              className="size-8"
                              actions={[
                                { label: "Edit", icon: Edit2, onSelect: () => openRecordDialog("residence", Object.fromEntries(["houseNumber", "addressLine1", "addressLine2", "addressLine3", "areaWard", "districtCity", "regionState", "country", "postalCode"].map((key) => [key, stringValue(record[key])])), index) },
                                { label: active ? "Deactivate" : "Activate", icon: active ? UserX : Check, onSelect: () => void setResidenceActive(index, !active) },
                              ]}
                            />
                          ) : "—",
                        ];
                      })
                    : currentResidence ? [[
                        "", currentResidence, "", "", "", "", "", "", "",
                        canEdit ? (
                          <RowActionsMenu
                            key="current-residence"
                            label="residence 1"
                            className="size-8"
                            actions={[
                              { label: "Edit", icon: Edit2, onSelect: () => openRecordDialog("residence", { addressLine1: currentResidence }, 0) },
                              { label: "Deactivate", icon: UserX, onSelect: () => void setResidenceActive(0, false) },
                            ]}
                          />
                        ) : "—",
                      ]] : []}
                  emptyMessage="No data available"
                  minTableWidth={1080}
                />
              </div>
            </TabsContent>

            <TabsContent value="kyc">
              <div className="min-h-[260px] rounded-b-[8px] bg-white px-[18px] pb-[18px] pt-[14px]">
                <div className="mb-3 flex gap-2">
                  <Button type="button" variant="outline" disabled={!canEdit} onClick={() => openRecordDialog("kyc")} className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint"><Plus className="size-[14px]" aria-hidden="true" />Add KYC</Button>
                  <Button type="button" variant="outline" disabled={!canEdit} onClick={() => void unapproveKyc()} className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">Unapprove KYC</Button>
                </div>
                <TabTable
                  columns={["Document Type", "File", "Uploaded Date", "Comments", "Actions"]}
                  rows={[
                    ...kycDocuments.map((document) => [
                      document.documentType,
                      <a key={document.id} href={clientKycDocumentUrl(id, document.id)} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">{document.fileName}</a>,
                      document.createdAt.slice(0, 10),
                      document.comments ?? "",
                      "—",
                    ]),
                    ...kycRecords.map((record) => [stringValue(record.documentType), stringValue(record.documentName), stringValue(record.uploadedDate), stringValue(record.comments), "—"]),
                  ]}
                  emptyMessage="No data available"
                  emptyHeight={150}
                />
              </div>
            </TabsContent>

            <TabsContent value="income">
              <div className="min-h-[180px] rounded-b-[8px] bg-white px-[18px] pb-[18px] pt-[14px]">
                <div className="mb-3 flex justify-end">
                  <Button type="button" variant="outline" disabled={!canEdit} onClick={() => openRecordDialog("income")} className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint"><Plus className="size-[14px]" aria-hidden="true" />Add Income</Button>
                </div>
                <TabTable columns={["Company Name", "Company Address", "Monthly Income", "Contract Type", "Business Address", "Business Registration Number(Brela)", "Business License Number", "TIN Number", "Business Turn Over(weekly,yearly)", "Actions"]} rows={incomeRecords.map((record) => ["companyName", "companyAddress", "monthlyIncome", "contractType", "businessAddress", "registrationNumber", "businessLicenseNumber", "tinNumber", "businessTurnover"].map((key) => stringValue(record[key])).concat("—"))} emptyMessage="No data available" minTableWidth={1500} />
              </div>
            </TabsContent>

            <TabsContent value="assets">
              <div className="min-h-[180px] rounded-b-[8px] bg-white px-[18px] pb-[18px] pt-[14px]">
                <div className="mb-3 flex justify-end">
                  <Button type="button" variant="outline" disabled={!canEdit} onClick={() => openRecordDialog("asset")} className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint"><Plus className="size-[14px]" aria-hidden="true" />Add Asset</Button>
                </div>
                <TabTable columns={["Type", "Value", "Location", "Comments / Notes", "Actions"]} rows={assetRecords.map((record) => [stringValue(record.assetType), stringValue(record.value), stringValue(record.location), stringValue(record.notes), "—"])} emptyMessage="No data available" />
              </div>
            </TabsContent>

            <TabsContent value="bank">
              <div className="min-h-[180px] rounded-b-[8px] bg-white px-[18px] pb-[18px] pt-[14px]">
                <div className="mb-3 flex justify-end">
                  <Button type="button" variant="outline" disabled={!canEdit} onClick={() => openRecordDialog("bank")} className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint"><Plus className="size-[14px]" aria-hidden="true" />Add Bank</Button>
                </div>
                <TabTable columns={["Bank Name", "Account Number", "BIC/Swift Code", "Branch Address", "Actions"]} rows={bankRecords.map((record) => [stringValue(record.bankName), stringValue(record.accountNumber), stringValue(record.bicSwiftCode), stringValue(record.branchAddress), "—"])} emptyMessage="No data available" />
              </div>
            </TabsContent>

            <TabsContent value="verification-history">
              <div className="min-h-[180px] rounded-b-[8px] bg-white px-[18px] pb-[18px] pt-[14px]">
                <TabTable columns={["Date and Time", "Verification Type", "Verification Status", "Verification Identifier", "Performed By", "Reference ID / Source", "Error", "Actions"]} rows={[]} emptyMessage="No data available" emptyHeight={140} minTableWidth={1024} />
              </div>
            </TabsContent>

            <TabsContent value="statement">
              <div className="min-h-[180px] rounded-b-[8px] bg-white px-[18px] pb-[18px] pt-[14px]">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-[13.44px] text-muted-foreground">Start Date</label>
                  <Input type="date" value={statementStart} onChange={(event) => setStatementStart(event.target.value)} className="h-[var(--control-height)] w-[220px]" />
                </div>
                <div>
                  <label className="mb-1 block text-[13.44px] text-muted-foreground">End Date</label>
                  <Input type="date" value={statementEnd} onChange={(event) => setStatementEnd(event.target.value)} className="h-[var(--control-height)] w-[220px]" />
                </div>
                <Button className="h-[var(--control-height)] px-5 text-[11.76px] font-medium"><Check className="size-4" aria-hidden="true" />Submit</Button>
                <Button variant="outline" disabled className="h-[var(--control-height)] px-5 text-[11.76px] font-medium"><Printer className="size-4" aria-hidden="true" />Print</Button>
                <Button variant="outline" disabled className="h-[var(--control-height)] px-5 text-[11.76px] font-medium"><Download className="size-4" aria-hidden="true" />Download<ChevronDown className="size-3.5" aria-hidden="true" /></Button>
              </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-b-[8px] bg-white px-4 py-8 text-center">
                <Clock3 className="size-10 text-[#6c757d]" aria-hidden="true" />
                <h2 className="text-[15.12px] font-semibold text-[#495057]">History</h2>
                <p className="text-[13.44px] text-muted-foreground">No history records found.</p>
              </div>
            </TabsContent>
          </Tabs>
          <ClientRecordDialog
            key={recordDialogInstance}
            kind={recordDialogKind}
            initialValues={recordDialogInitialValues}
            isEditing={editingResidenceIndex !== null}
            open={recordDialogKind !== null}
            saving={savingRecord}
            error={recordError}
            onOpenChange={(open) => { if (!open && !savingRecord) { setRecordDialogKind(null); setEditingResidenceIndex(null); } }}
            onSubmit={(values, file) => { if (recordDialogKind) void saveProfileRecord(recordDialogKind, values, editingResidenceIndex, file); }}
          />
        </>
      ) : null}
    </div>
  );
}
