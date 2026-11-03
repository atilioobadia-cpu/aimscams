"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Building2,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Inbox,
  Maximize2,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import {
  createFixedAsset,
  getAccountingSettings,
  listAssetTypes,
  listFixedAssets,
  parseMajorToMinor,
  type AssetType,
  type FixedAsset,
  type GlAccount,
} from "@/lib/accounting";
import { formatTzs } from "@/lib/format";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load fixed assets.";
}

type AssetForm = {
  name: string;
  assetNo: string;
  purchaseDate: string;
  entryDate: string;
  value: string;
  assetTypeId: string;
  assetStatus: string;
  description: string;
  serialNumber: string;
  warrantyExpiry: string;
  creditorLedgerId: string;
  paymentMode: "CASH" | "JOURNAL";
  increaseInValue: string;
  increaseInValueEntryDate: string;
  depreciationMethod: string;
  averagingMethod: string;
  effectiveLifeYears: string;
  depreciationDuringYear: string;
  accumulatedDepreciation: string;
  bookValue: string;
  supplierName: string;
  supplierCompany: string;
  supplierAddress: string;
};

function emptyForm(): AssetForm {
  return {
    name: "",
    assetNo: "FA-0001",
    purchaseDate: "",
    entryDate: "",
    value: "",
    assetTypeId: "",
    assetStatus: "",
    description: "",
    serialNumber: "",
    warrantyExpiry: "",
    creditorLedgerId: "",
    paymentMode: "CASH",
    increaseInValue: "",
    increaseInValueEntryDate: "",
    depreciationMethod: "",
    averagingMethod: "",
    effectiveLifeYears: "",
    depreciationDuringYear: "",
    accumulatedDepreciation: "",
    bookValue: "",
    supplierName: "",
    supplierCompany: "",
    supplierAddress: "",
  };
}

function dateText(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function ledgerLabel(account: GlAccount) {
  return `${account.code} ${account.name}`;
}

type ImportRow = Parameters<typeof createFixedAsset>[0];

function headerKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cellValue(row: Record<string, unknown>, ...headers: string[]) {
  const wanted = new Set(headers.map(headerKey));
  const match = Object.entries(row).find(([key]) => wanted.has(headerKey(key)))?.[1];
  return match === undefined || match === null ? "" : String(match).trim();
}

function importedDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const parts = XLSX.SSF.parse_date_code(value);
    if (parts) return `${String(parts.y).padStart(4, "0")}-${String(parts.m).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}`;
  }
  const raw = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  return raw && !Number.isNaN(parsed.valueOf()) ? parsed.toISOString().slice(0, 10) : "";
}

function mapImportRows(rows: Record<string, unknown>[], assetTypes: AssetType[], accounts: GlAccount[]) {
  const errors: string[] = [];
  const mapped: ImportRow[] = [];
  rows.forEach((row, index) => {
    const line = index + 2;
    const name = cellValue(row, "Asset name", "Asset Name");
    const assetNo = cellValue(row, "Asset / Invoice Number", "Asset Number");
    const purchaseDate = importedDate(row[Object.keys(row).find((key) => headerKey(key) === "assetpurchasedate") ?? ""]);
    const entryDateText = row[Object.keys(row).find((key) => headerKey(key) === "assetentrydate") ?? ""];
    const entryDate = importedDate(entryDateText) || purchaseDate;
    const valueText = cellValue(row, "Asset Value", "Asset Value (TSh)", "Purchase Price (TSh)");
    const costMinor = parseMajorToMinor(valueText);
    const typeName = cellValue(row, "Asset Type");
    const assetType = assetTypes.find((item) => item.name.toLowerCase() === typeName.toLowerCase());
    const statusText = cellValue(row, "Asset Status").toLowerCase();
    const assetStatus = statusText.includes("grant") ? "FIXED_GRANT" : statusText.includes("purchas") ? "PURCHASED" : "";
    const methodText = cellValue(row, "Depreciation Method").toLowerCase();
    const depreciationMethod = methodText.includes("diminishing")
      ? "DIMINISHING_BALANCE"
      : methodText.includes("straight")
        ? "STRAIGHT_LINE"
        : methodText.includes("no depreciation")
          ? "NO_DEPRECIATION"
          : "";
    const ledgerText = cellValue(row, "Creditor's Ledger", "Creditor Ledger").toLowerCase();
    const ledger = accounts.find((account) => ledgerText === account.code.toLowerCase() || ledgerText === ledgerLabel(account).toLowerCase());
    const required: [string, string][] = [
      [name, "Asset name"],
      [assetNo, "Asset / Invoice Number"],
      [purchaseDate, "Asset Purchase Date"],
      [entryDate, "Asset Entry Date"],
      [valueText, "Asset Value"],
      [assetType?.id ?? "", "Asset Type (use the configured asset type name)"],
      [assetStatus, "Asset Status"],
      [depreciationMethod, "Depreciation Method"],
    ];
    const missing = required.filter(([value]) => !value).map(([, label]) => label);
    if (costMinor === null) missing.push("valid Asset Value");
    if (ledgerText && !ledger) missing.push("valid Creditor's Ledger code or name");
    if (missing.length) {
      errors.push(`Row ${line}: ${missing.join(", ")}.`);
      return;
    }
    const averagingText = cellValue(row, "Averaging Method").toLowerCase();
    const averagingMethod = averagingText.startsWith("month") ? "MONTHLY" : averagingText.startsWith("year") ? "YEARLY" : "";
    const number = (field: string) => cellValue(row, field);
    mapped.push({
      assetNo,
      description: name,
      notes: cellValue(row, "Description"),
      acquisitionDate: purchaseDate,
      entryDate,
      acquisitionCostMinor: costMinor!.toString(),
      assetTypeId: assetType!.id,
      assetStatus,
      depreciationMethod,
      averagingMethod,
      serialNumber: cellValue(row, "Serial Number"),
      warrantyExpiry: importedDate(row[Object.keys(row).find((key) => headerKey(key) === "warrantyexpiry") ?? ""]),
      creditorLedgerId: ledger?.id ?? "",
      paymentMode: cellValue(row, "Payment Mode").toLowerCase() === "journal" ? "JOURNAL" : "CASH",
      increaseInValue: number("Increase in Value"),
      increaseInValueEntryDate: importedDate(row[Object.keys(row).find((key) => headerKey(key) === "increaseinvalueentrydate") ?? ""]),
      effectiveLifeYears: number("Effective Life (Years)"),
      depreciationDuringYear: number("Depreciation during the year"),
      accumulatedDepreciation: number("Accumulated depreciation"),
      bookValue: number("Fair / Book value"),
      supplierName: cellValue(row, "Supplier Name"),
      supplierCompany: cellValue(row, "Supplier Company"),
      supplierAddress: cellValue(row, "Supplier Address"),
    });
  });
  if (!rows.length) errors.push("The selected worksheet has no asset rows.");
  return { mapped, errors };
}

function DetailField({
  label,
  id,
  required,
  children,
  wide = false,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`block fs-text text-body ${wide ? "md:col-span-2" : ""}`} htmlFor={id}>
      {label}{required ? <span className="text-danger"> *</span> : null}
      {children}
    </label>
  );
}

const fieldClass = "mt-1.5 h-[35px] w-full rounded-[5px] border border-input bg-surface px-3 fs-text text-body";

export function FixedAssetRegisterPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [draftStatus, setDraftStatus] = useState("All");
  const [statusCondition, setStatusCondition] = useState("Is");
  const [filterOpen, setFilterOpen] = useState(false);
  const [form, setForm] = useState<AssetForm>(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void Promise.allSettled([listFixedAssets(), listAssetTypes(), getAccountingSettings()])
        .then(([assetResult, typeResult, settingsResult]) => {
          if (cancelled) return;
          if (assetResult.status === "fulfilled") {
            setAssets(assetResult.value);
            setForbidden(false);
          } else if (assetResult.reason instanceof ApiError && assetResult.reason.status === 403) {
            setForbidden(true);
            setAssets([]);
          } else {
            setError(failureMessage(assetResult.reason));
          }
          setAssetTypes(typeResult.status === "fulfilled" ? typeResult.value : []);
          setAccounts(
            settingsResult.status === "fulfilled"
              ? settingsResult.value.accounts.filter((account) => account.isPostable)
              : [],
          );
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

  function update<K extends keyof AssetForm>(key: K, value: AssetForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setCreateError(null);
    setForm(emptyForm());
    setMaximized(false);
    setCreateOpen(true);
  }

  function openImport() {
    setImportFile(null);
    setImportRows([]);
    setImportErrors([]);
    setImportResult("");
    setImportOpen(true);
  }

  async function handleImportFile(file: File | undefined) {
    setImportFile(file ?? null);
    setImportRows([]);
    setImportErrors([]);
    setImportResult("");
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImportErrors(["The selected file exceeds the 5 MB limit."]);
      return;
    }
    if (!/\.(csv|xlsx)$/i.test(file.name)) {
      setImportErrors(["Choose a .csv or .xlsx file."]);
      return;
    }
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) {
        setImportErrors(["The selected file has no worksheet."]);
        return;
      }
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], { defval: "", raw: true });
      const result = mapImportRows(rows, assetTypes, accounts);
      setImportRows(result.mapped);
      setImportErrors(result.errors);
    } catch {
      setImportErrors(["The selected file could not be read. Check that it is a valid CSV or XLSX file."]);
    }
  }

  async function handleImport() {
    setImportBusy(true);
    setImportResult("");
    let imported = 0;
    for (let index = 0; index < importRows.length; index += 1) {
      try {
        await createFixedAsset(importRows[index]);
        imported += 1;
      } catch (failure) {
        setImportErrors([`Imported ${imported} of ${importRows.length}. Row ${index + 2} failed: ${failureMessage(failure)}`]);
        setImportBusy(false);
        setReloadKey((value) => value + 1);
        return;
      }
    }
    setImportBusy(false);
    setImportResult(`Imported ${imported} fixed asset${imported === 1 ? "" : "s"}.`);
    setReloadKey((value) => value + 1);
    setImportRows([]);
    setImportFile(null);
  }

  function downloadSampleFile() {
    const headers = [
      "Asset name", "Asset / Invoice Number", "Asset Purchase Date", "Asset Entry Date", "Asset Value",
      "Asset Type", "Asset Status", "Depreciation Method", "Averaging Method", "Serial Number",
      "Warranty Expiry", "Creditor's Ledger", "Payment Mode", "Increase in Value",
      "Increase In Value Entry Date", "Effective Life (Years)", "Depreciation during the year",
      "Accumulated depreciation", "Fair / Book value", "Supplier Name", "Supplier Company",
      "Supplier Address", "Description",
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers]), "Fixed Assets");
    XLSX.writeFile(workbook, "fixed-assets-sample.xlsx");
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const costMinor = parseMajorToMinor(form.value);
    const increaseMinor = parseMajorToMinor(form.increaseInValue || "0");
    const depreciationMinor = parseMajorToMinor(form.depreciationDuringYear || "0");
    const accumulatedMinor = parseMajorToMinor(form.accumulatedDepreciation || "0");
    const bookMinor = parseMajorToMinor(form.bookValue || "0");
    if ([costMinor, increaseMinor, depreciationMinor, accumulatedMinor, bookMinor].some((value) => value === null)) {
      setCreateError("Enter amounts using up to two decimal places.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createFixedAsset({
        assetNo: form.assetNo,
        description: form.name,
        notes: form.description,
        acquisitionDate: form.purchaseDate,
        entryDate: form.entryDate,
        acquisitionCostMinor: costMinor!.toString(),
        assetTypeId: form.assetTypeId,
        assetStatus: form.assetStatus,
        serialNumber: form.serialNumber,
        warrantyExpiry: form.warrantyExpiry,
        creditorLedgerId: form.creditorLedgerId,
        paymentMode: form.paymentMode,
        increaseInValue: form.increaseInValue,
        increaseInValueEntryDate: form.increaseInValueEntryDate,
        depreciationMethod: form.depreciationMethod,
        averagingMethod: form.averagingMethod,
        effectiveLifeYears: form.effectiveLifeYears,
        depreciationDuringYear: form.depreciationDuringYear,
        accumulatedDepreciation: form.accumulatedDepreciation,
        bookValue: form.bookValue,
        supplierName: form.supplierName,
        supplierCompany: form.supplierCompany,
        supplierAddress: form.supplierAddress,
      });
      setCreateOpen(false);
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setCreateError(failureMessage(failure));
    } finally {
      setCreating(false);
    }
  }

  const filtered = assets.filter((item) => {
    if (!statusFilter || statusFilter === "All") return true;
    const active = item.status === "ACTIVE";
    const match = statusFilter === "Active" ? active : !active;
    return statusCondition === "Is Not" || statusCondition === "Is None Of" ? !match : match;
  });
  const hasTypes = assetTypes.length > 0;

  const importDialog = importOpen ? (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/35 p-3"
      onMouseDown={(event) => { if (event.target === event.currentTarget) setImportOpen(false); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="fixed-asset-import-title" className="w-[520px] max-w-full overflow-hidden rounded-[10px] border border-card-border bg-surface shadow-xl">
        <header className="flex h-[54px] items-center justify-between border-b border-card-border px-5">
          <h2 id="fixed-asset-import-title" className="fs-title font-semibold text-heading">Import Fixed Assets</h2>
          <button type="button" aria-label="Close" onClick={() => setImportOpen(false)} className="grid size-7 place-items-center rounded text-label hover:bg-subtle"><X className="size-4" aria-hidden="true" /></button>
        </header>
        <div className="space-y-3 px-5 py-4">
          <label className="block fs-text font-medium text-body" htmlFor="fixed-asset-import-file">File</label>
          <div className="flex items-center gap-3">
            <label htmlFor="fixed-asset-import-file" className="inline-flex h-[35px] cursor-pointer items-center gap-2 rounded-[5px] border border-primary px-3 fs-text font-medium text-primary hover:bg-primary-tint">
              <FileSpreadsheet className="size-4" aria-hidden="true" />Select File
              <input id="fixed-asset-import-file" type="file" accept=".csv,.xlsx" className="sr-only" onChange={(event) => void handleImportFile(event.target.files?.[0])} />
            </label>
            <span className="min-w-0 truncate fs-text text-muted-foreground">{importFile?.name ?? "No file chosen"}</span>
          </div>
          <p className="fs-text text-muted-foreground">Supported: .csv, .xlsx (max 5MB)</p>
          <button type="button" onClick={downloadSampleFile} className="fs-text text-primary underline underline-offset-2 hover:text-primary/80">Download sample file</button>
          {importRows.length ? <p className="fs-text text-body">Ready to import {importRows.length} fixed asset{importRows.length === 1 ? "" : "s"}.</p> : null}
          {importResult ? <p className="fs-text text-primary" role="status">{importResult}</p> : null}
          {importErrors.length ? <ul className="max-h-[132px] list-disc space-y-1 overflow-y-auto pl-5 fs-text text-accent-red" role="alert">{importErrors.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        </div>
        <footer className="flex h-[58px] items-center justify-end gap-2 border-t border-card-border px-5">
          <Button type="button" variant="outline" className="h-[35px] rounded-[5px] px-4" onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button type="button" disabled={importBusy || !importRows.length || importErrors.length > 0} onClick={() => void handleImport()} className="h-[35px] rounded-[5px] px-4">
            <Download className="size-4" aria-hidden="true" />{importBusy ? "Importing..." : "Import"}
          </Button>
        </footer>
      </section>
    </div>
  ) : null;

  const formDrawer = createOpen ? (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/35 p-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setCreateOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="fixed-asset-details-title"
        className={`flex max-h-[calc(100vh-32px)] flex-col overflow-hidden rounded-[12px] border border-card-border bg-surface shadow-xl ${maximized ? "h-[calc(100vh-32px)] w-full" : "h-[min(760px,calc(100vh-32px))] w-[672px] max-w-full translate-y-[6px]"}`}
      >
        <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-card-border px-5">
          <h2 id="fixed-asset-details-title" className="fs-title font-semibold text-heading">Details</h2>
          <div className="flex items-center gap-2">
            <button type="button" aria-label={maximized ? "Restore" : "Maximize"} onClick={() => setMaximized((value) => !value)} className="grid size-8 place-items-center rounded border border-input text-label hover:bg-subtle">
              <Maximize2 className="size-4" aria-hidden="true" />
            </button>
            <button type="button" aria-label="Close" onClick={() => setCreateOpen(false)} className="grid size-8 place-items-center rounded text-label hover:bg-subtle">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </header>
        <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto pl-5 pr-[36px] pt-[13px]">
            <div className="grid grid-cols-1 gap-x-4 gap-y-[14px] md:grid-cols-2">
              <DetailField label="Asset name" id="fixed-asset-name" required>
                <Input id="fixed-asset-name" value={form.name} onChange={(event) => update("name", event.target.value)} className={fieldClass} required />
              </DetailField>
              <DetailField label="Asset / Invoice Number" id="fixed-asset-number" required>
                <Input id="fixed-asset-number" value={form.assetNo} onChange={(event) => update("assetNo", event.target.value)} className={fieldClass} required />
              </DetailField>
              <DetailField label="Asset Purchase Date" id="fixed-asset-purchase-date" required>
                <Input id="fixed-asset-purchase-date" type="date" value={form.purchaseDate} onChange={(event) => update("purchaseDate", event.target.value)} className={fieldClass} required />
              </DetailField>
              <DetailField label="Asset Entry Date" id="fixed-asset-entry-date" required>
                <Input id="fixed-asset-entry-date" type="date" value={form.entryDate} onChange={(event) => update("entryDate", event.target.value)} className={fieldClass} required />
              </DetailField>
              <DetailField label="Asset Value (TSh)" id="fixed-asset-value" required>
                <Input id="fixed-asset-value" type="number" min="0" step="0.01" value={form.value} onChange={(event) => update("value", event.target.value)} className={fieldClass} required />
              </DetailField>
              <DetailField label="Asset Type" id="fixed-asset-type" required>
                <select id="fixed-asset-type" value={form.assetTypeId} onChange={(event) => update("assetTypeId", event.target.value)} className={fieldClass} required>
                  <option value="">{hasTypes ? "Select asset type" : "No asset types available"}</option>
                  {assetTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </DetailField>
              <DetailField label="Asset Status" id="fixed-asset-status" required>
                <select id="fixed-asset-status" value={form.assetStatus} onChange={(event) => update("assetStatus", event.target.value)} className={fieldClass} required>
                  <option value="">Select asset status</option>
                  <option value="PURCHASED">Purchased Asset</option>
                  <option value="FIXED_GRANT">Fixed Grant Asset</option>
                </select>
              </DetailField>
              <DetailField label="Description" id="fixed-asset-description" wide>
                <textarea id="fixed-asset-description" value={form.description} onChange={(event) => update("description", event.target.value)} className="mt-1.5 min-h-[72px] w-full resize-y rounded-[5px] border border-input bg-surface px-3 py-2 fs-text text-body" />
              </DetailField>
              <DetailField label="Serial Number" id="fixed-asset-serial">
                <Input id="fixed-asset-serial" value={form.serialNumber} onChange={(event) => update("serialNumber", event.target.value)} className={fieldClass} />
              </DetailField>
              <DetailField label="Warranty Expiry" id="fixed-asset-warranty">
                <Input id="fixed-asset-warranty" type="date" value={form.warrantyExpiry} onChange={(event) => update("warrantyExpiry", event.target.value)} className={fieldClass} />
              </DetailField>
              <DetailField label="Creditor's Ledger" id="fixed-asset-creditor-ledger">
                <select id="fixed-asset-creditor-ledger" value={form.creditorLedgerId} onChange={(event) => update("creditorLedgerId", event.target.value)} className={fieldClass}>
                  <option value="">Select creditor ledger</option>
                  {accounts.map((account) => <option key={account.id} value={account.id}>{ledgerLabel(account)}</option>)}
                </select>
              </DetailField>
              <fieldset className="md:col-span-2">
                <legend className="mb-2 fs-text text-body">Payment mode</legend>
                <div className="flex gap-5 fs-text text-body">
                  {(["CASH", "JOURNAL"] as const).map((mode) => (
                    <label key={mode} className="flex items-center gap-2">
                      <input type="radio" name="fixed-asset-payment-mode" value={mode} checked={form.paymentMode === mode} onChange={() => update("paymentMode", mode)} className="accent-primary" />
                      {mode === "CASH" ? "Cash" : "Journal"}
                    </label>
                  ))}
                </div>
              </fieldset>
              <DetailField label="Increase in Value (TSh)" id="fixed-asset-increase">
                <Input id="fixed-asset-increase" type="number" min="0" step="0.01" value={form.increaseInValue} onChange={(event) => update("increaseInValue", event.target.value)} className={fieldClass} />
              </DetailField>
              <DetailField label="Increase In Value Entry Date" id="fixed-asset-increase-date">
                <Input id="fixed-asset-increase-date" type="date" value={form.increaseInValueEntryDate} onChange={(event) => update("increaseInValueEntryDate", event.target.value)} className={fieldClass} />
              </DetailField>
              <DetailField label="Depreciation Method" id="fixed-asset-depreciation-method" required>
                <select id="fixed-asset-depreciation-method" value={form.depreciationMethod} onChange={(event) => update("depreciationMethod", event.target.value)} className={fieldClass} required>
                  <option value="">Select depreciation method</option>
                  <option value="NO_DEPRECIATION">No Depreciation</option>
                  <option value="STRAIGHT_LINE">Straight Line</option>
                  <option value="DIMINISHING_BALANCE">Diminishing Balance</option>
                </select>
              </DetailField>
              <DetailField label="Averaging Method" id="fixed-asset-averaging-method">
                <select id="fixed-asset-averaging-method" value={form.averagingMethod} onChange={(event) => update("averagingMethod", event.target.value)} className={fieldClass}>
                  <option value="">Select averaging method</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </DetailField>
              <DetailField label="Effective Life (Years)" id="fixed-asset-effective-life">
                <Input id="fixed-asset-effective-life" type="number" min="0" step="1" value={form.effectiveLifeYears} onChange={(event) => update("effectiveLifeYears", event.target.value)} className={fieldClass} />
              </DetailField>
              <DetailField label="Depreciation during the year (TSh)" id="fixed-asset-depreciation-year">
                <Input id="fixed-asset-depreciation-year" type="number" min="0" step="0.01" value={form.depreciationDuringYear} onChange={(event) => update("depreciationDuringYear", event.target.value)} className={fieldClass} />
              </DetailField>
              <DetailField label="Accumulated depreciation (TSh)" id="fixed-asset-accumulated-depreciation">
                <Input id="fixed-asset-accumulated-depreciation" type="number" min="0" step="0.01" value={form.accumulatedDepreciation} onChange={(event) => update("accumulatedDepreciation", event.target.value)} className={fieldClass} />
              </DetailField>
              <DetailField label="Fair / Book value (TSh)" id="fixed-asset-book-value">
                <Input id="fixed-asset-book-value" type="number" min="0" step="0.01" value={form.bookValue} onChange={(event) => update("bookValue", event.target.value)} className={fieldClass} />
              </DetailField>
              <DetailField label="Supplier Name" id="fixed-asset-supplier-name">
                <Input id="fixed-asset-supplier-name" value={form.supplierName} onChange={(event) => update("supplierName", event.target.value)} className={fieldClass} />
              </DetailField>
              <DetailField label="Supplier Company" id="fixed-asset-supplier-company">
                <Input id="fixed-asset-supplier-company" value={form.supplierCompany} onChange={(event) => update("supplierCompany", event.target.value)} className={fieldClass} />
              </DetailField>
              <DetailField label="Supplier Address" id="fixed-asset-supplier-address" wide>
                <textarea id="fixed-asset-supplier-address" value={form.supplierAddress} onChange={(event) => update("supplierAddress", event.target.value)} className="mt-1.5 min-h-[72px] w-full resize-y rounded-[5px] border border-input bg-surface px-3 py-2 fs-text text-body" />
              </DetailField>
            </div>
            {createError ? <p className="mt-3 fs-text text-accent-red" role="alert">{createError}</p> : null}
          </div>
          <footer className="flex h-[58px] shrink-0 items-center justify-end gap-2 border-t border-card-border px-5">
            <Button type="button" variant="outline" className="h-[35px] rounded-[5px] px-4" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={creating || !form.name || !form.assetNo || !form.value || !form.assetTypeId || !form.assetStatus || !form.depreciationMethod} className="h-[35px] rounded-[5px] px-4">
              <Check className="size-4" aria-hidden="true" />{creating ? "Saving..." : "Save"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  ) : null;

  if (forbidden) {
    return (
      <div className="space-y-[14px]">
        <header className="flex h-[70px] items-center justify-between rounded-[6px] border border-card-border bg-surface px-5">
          <div className="flex items-center gap-3"><Building2 className="size-5 text-primary" aria-hidden="true" /><h1 className="fs-title font-bold text-heading">Fixed Assets</h1></div>
          <Button variant="outline" onClick={openCreate} className="h-[30px] rounded-[5px] border-primary px-2 fs-text text-primary"><Plus className="size-4" aria-hidden="true" />Add Fixed Asset</Button>
        </header>
        <ForbiddenPanel message="Your role cannot view fixed assets. Ask an administrator for Settings Accounting : View." />
        {formDrawer}
        {importDialog}
      </div>
    );
  }

  return (
    <div className="space-y-[14px]">
      <header className="flex h-[70px] items-center justify-between rounded-[6px] border border-card-border bg-surface px-5">
        <div className="flex items-center gap-3"><Building2 className="size-5 text-primary" aria-hidden="true" /><h1 className="fs-title font-bold text-heading">Fixed Assets</h1></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openCreate} className="h-[30px] rounded-[5px] border-primary px-2 fs-text text-primary"><Plus className="size-4" aria-hidden="true" />Add Fixed Asset</Button>
          <Button variant="outline" onClick={openImport} className="h-[30px] rounded-[5px] border-primary px-2 fs-text text-primary"><Download className="size-4" aria-hidden="true" />Import</Button>
        </div>
      </header>

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section className="overflow-visible rounded-[6px] border border-card-border bg-surface">
        <div className="relative flex h-[55px] items-center border-b border-chrome px-3">
          <button type="button" aria-expanded={filterOpen} aria-label="Filter by Show" onClick={() => setFilterOpen((value) => !value)} className="inline-flex h-[35px] items-center gap-2 rounded-[5px] border border-primary px-3 fs-text font-medium text-primary hover:bg-primary-tint">
            Show <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>
          {filterOpen ? (
            <div className="absolute left-3 top-[43px] z-30 w-[350px] rounded-[6px] border border-card-border bg-surface p-4 shadow-lg" role="dialog" aria-label="Show filter">
              <label className="block fs-text font-medium text-body" htmlFor="fixed-asset-status-condition">Condition</label>
              <select id="fixed-asset-status-condition" value={statusCondition} onChange={(event) => setStatusCondition(event.target.value)} className="mt-1.5 h-[35px] w-full rounded-[5px] border border-input bg-surface px-3 fs-text text-body">
                <option>Is</option><option>Is Any Of</option><option>Is Not</option><option>Is None Of</option>
              </select>
              <label className="mt-3 block fs-text font-medium text-body" htmlFor="fixed-asset-status-value">Value</label>
              <select id="fixed-asset-status-value" value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)} className="mt-1.5 h-[35px] w-full rounded-[5px] border border-input bg-surface px-3 fs-text text-body">
                <option>All</option><option>Active</option><option>Sold &amp; Disposed</option>
              </select>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" className="h-[30px] rounded-[5px] px-3 fs-text" onClick={() => { setDraftStatus("All"); setStatusFilter(""); }}>Clear</Button>
                <Button type="button" className="h-[30px] rounded-[5px] px-3 fs-text" onClick={() => { setStatusFilter(draftStatus === "Sold & Disposed" ? "Disposed" : draftStatus); setFilterOpen(false); }}>Apply</Button>
              </div>
            </div>
          ) : null}
        </div>
        {loading ? (
          <div className="rounded-b-[6px] border-0 bg-surface"><PanelSkeleton rows={3} /></div>
        ) : (
          <div className="overflow-x-auto rounded-b-[6px]">
            <table className="w-full min-w-[900px] table-fixed text-left fs-text">
              <colgroup><col className="w-[14%]" /><col className="w-[16%]" /><col className="w-[13%]" /><col className="w-[16%]" /><col className="w-[19%]" /><col className="w-[18%]" /><col className="w-[4%]" /></colgroup>
              <thead className="h-[38px] border-b border-card-border bg-subtle font-semibold text-label">
                <tr>
                  <th className="whitespace-nowrap px-3">Asset Name</th>
                  <th className="whitespace-nowrap px-3">Asset Number</th>
                  <th className="whitespace-nowrap px-3">Asset Type</th>
                  <th className="whitespace-nowrap px-3">Purchase Date</th>
                  <th className="whitespace-nowrap px-3">Entry Date</th>
                  <th className="whitespace-nowrap px-3 text-right">Purchase Price (TSh)</th>
                  <th className="px-3 text-center"><span className="sr-only">Actions</span><SlidersHorizontal className="mx-auto size-4" aria-hidden="true" /></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="h-[170px] p-0" style={{ padding: 0 }}>
                    <div className="flex h-[170px] flex-col items-center justify-center gap-3 text-label">
                      <Inbox className="size-12" strokeWidth={1.8} aria-hidden="true" />
                      <span className="fs-text">No data available</span>
                    </div>
                  </td></tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="h-[50px] border-b border-card-border last:border-0">
                    <td className="truncate px-3 font-medium text-strong" title={item.description}>{item.description}</td>
                    <td className="truncate px-3 text-body" title={item.assetNo}>{item.assetNo}</td>
                    <td className="truncate px-3 text-body">{item.assetType?.name ?? "N/A"}</td>
                    <td className="whitespace-nowrap px-3 text-body">{dateText(item.acquisitionDate)}</td>
                    <td className="whitespace-nowrap px-3 text-body">{dateText(item.entryDate)}</td>
                    <td className="whitespace-nowrap px-3 text-right tabular-nums text-body">{formatTzs(item.acquisitionCostMinor)}</td>
                    <td className="px-3 text-center text-body" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {formDrawer}
      {importDialog}
    </div>
  );
}
