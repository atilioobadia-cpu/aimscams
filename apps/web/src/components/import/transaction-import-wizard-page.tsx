"use client";

import { useRef, useState } from "react";
import { AlertTriangle, BookText, CheckCircle2, CloudUpload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { parseCsv } from "@/lib/csv";
import { createImportBatch, completeImportBatch } from "@/lib/settings";
import { createTransaction } from "@/lib/transactions";

type TransactionField =
  | "transactionNo"
  | "type"
  | "amountMinor"
  | "clientId"
  | "savingsAccountId"
  | "loanId"
  | "counterAccountCode"
  | "paymentMethod"
  | "valueDate"
  | "narration";
type TransactionRow = {
  rowNumber: number;
  transactionNo: string;
  type: string;
  amountMinor: string;
  clientId: string;
  savingsAccountId: string;
  loanId: string;
  counterAccountCode: string;
  paymentMethod: string;
  valueDate: string;
  narration: string;
  valid: boolean;
  error: string | null;
};
type FieldMap = Record<TransactionField, string>;
type ImportResult = { success: number; failed: number; errors: string[] };

const WIZARD_STEPS = ["Upload File", "Field Mapping", "Validation And Preview", "Result"];
const FIELDS: { key: TransactionField; label: string; optional: boolean; match: RegExp }[] = [
  { key: "transactionNo", label: "Transaction Reference", optional: true, match: /transaction ?no|transaction ?number|external ?ref|reference/ },
  { key: "type", label: "Transaction Type", optional: false, match: /type/ },
  { key: "amountMinor", label: "Amount (minor units)", optional: false, match: /amount ?minor|amount/ },
  { key: "clientId", label: "Client ID", optional: true, match: /client ?id|member ?id/ },
  { key: "savingsAccountId", label: "Savings Account ID", optional: true, match: /savings ?account/ },
  { key: "loanId", label: "Loan ID", optional: true, match: /loan ?id/ },
  { key: "counterAccountCode", label: "Counter Account Code", optional: true, match: /counter ?account|account ?code/ },
  { key: "paymentMethod", label: "Payment Method", optional: true, match: /payment ?method/ },
  { key: "valueDate", label: "Value Date", optional: true, match: /value ?date|transaction ?date/ },
  { key: "narration", label: "Narration", optional: true, match: /narration|description|message/ },
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const EMPTY_MAP: FieldMap = {
  transactionNo: "", type: "", amountMinor: "", clientId: "", savingsAccountId: "", loanId: "",
  counterAccountCode: "", paymentMethod: "", valueDate: "", narration: "",
};

function detectFieldMap(headers: string[]): FieldMap {
  const map = { ...EMPTY_MAP };
  for (const field of FIELDS) {
    const index = headers.findIndex((header) => field.match.test(header.toLowerCase().replace(/[_-]/g, " ")));
    if (index >= 0) map[field.key] = String(index);
  }
  return map;
}

function mapTransactionRows(dataRows: string[][], mapping: FieldMap): TransactionRow[] {
  const getValue = (cells: string[], field: TransactionField) => {
    const index = Number(mapping[field]);
    return mapping[field] && Number.isInteger(index) ? (cells[index] ?? "").trim() : "";
  };

  return dataRows.map((cells, index) => {
    const transactionNo = getValue(cells, "transactionNo");
    const type = getValue(cells, "type").toUpperCase();
    const amountMinor = getValue(cells, "amountMinor");
    const clientId = getValue(cells, "clientId");
    const savingsAccountId = getValue(cells, "savingsAccountId");
    const loanId = getValue(cells, "loanId");
    const counterAccountCode = getValue(cells, "counterAccountCode");
    const paymentMethod = getValue(cells, "paymentMethod");
    const valueDate = getValue(cells, "valueDate");
    const narration = getValue(cells, "narration");
    let error: string | null = null;

    if (!type) error = "Transaction type is required";
    else if (!/^[0-9]+$/.test(amountMinor) || !/[1-9]/.test(amountMinor)) error = "Amount must be a positive whole number of minor units";
    else if (valueDate && !/^\d{4}-\d{2}-\d{2}$/.test(valueDate)) error = "Value date must use YYYY-MM-DD";
    else if (type.startsWith("SAVINGS_") && !savingsAccountId) error = "This transaction type needs a savings account ID";
    else if ((type.startsWith("LOAN_") && type !== "LOAN_APPLICATION_FEE" || type.startsWith("FEE_PENALTY_")) && !loanId) error = "This transaction type needs a loan ID";
    else if ((type.startsWith("SHARES_") || type === "LOAN_APPLICATION_FEE" || type === "ERROR_CORRECTION") && !clientId) error = "This transaction type needs a client ID";
    else if ((type.startsWith("GL_") || ["OTHER_INCOME", "RECORD_EXPENSE", "CONTRA", "REVERSE_GL_ENTRY", "TILL_TRANSFER"].includes(type)) && !counterAccountCode) error = "This transaction type needs a counter account code";
    else if (type === "JOURNAL_ENTRY") error = "Journal entry imports need paired ledger-account mapping, which is unavailable here";

    return {
      rowNumber: index + 2, transactionNo, type, amountMinor, clientId, savingsAccountId, loanId,
      counterAccountCode, paymentMethod, valueDate, narration, valid: error === null, error,
    };
  });
}

export function TransactionImportWizardPage() {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [fieldMap, setFieldMap] = useState<FieldMap>(EMPTY_MAP);
  const [parseError, setParseError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult | null>(null);
  const [reference, setReference] = useState(`TXN-IMP-${Date.now()}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rows = mapTransactionRows(dataRows, fieldMap);
  const validRows = rows.filter((row) => row.valid);
  const invalidRows = rows.filter((row) => !row.valid);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setFileName(null);
    setHeaders([]);
    setDataRows([]);
    setResults(null);
    setStep(1);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Excel files are not supported yet. Please choose a CSV file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setParseError("This file is larger than the 10MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result ?? ""));
      if (parsed.length < 2) {
        setParseError("The file needs a header row and at least one transaction row.");
        return;
      }
      const nextHeaders = parsed[0].map((header) => header.replace(/^\uFEFF/, ""));
      setHeaders(nextHeaders);
      setDataRows(parsed.slice(1));
      setFieldMap(detectFieldMap(nextHeaders));
      setFileName(file.name);
    };
    reader.onerror = () => setParseError("The selected CSV file could not be read.");
    reader.readAsText(file);
  }

  async function handleCommit() {
    setCommitting(true);
    setProgress(0);
    const errors: string[] = [];
    let success = 0;
    let failed = 0;
    let batchId: string | null = null;

    try {
      const batch = await createImportBatch({ reference, kind: "TRANSACTION", fileName: fileName ?? "transactions.csv", totalRows: rows.length });
      batchId = batch.id;
    } catch {
      // Continue with transaction creation if the optional batch endpoint is unavailable.
    }

    for (let index = 0; index < validRows.length; index += 1) {
      const row = validRows[index];
      try {
        await createTransaction({
          type: row.type,
          amountMinor: row.amountMinor,
          externalRef: row.transactionNo || undefined,
          clientId: row.clientId || undefined,
          savingsAccountId: row.savingsAccountId || undefined,
          loanId: row.loanId || undefined,
          counterAccountCode: row.counterAccountCode || undefined,
          paymentMethod: row.paymentMethod || undefined,
          valueDate: row.valueDate || undefined,
          narration: row.narration || undefined,
        });
        success += 1;
      } catch (error) {
        failed += 1;
        errors.push(`Row ${row.rowNumber}: ${error instanceof Error ? error.message : "Import failed"}`);
      }
      setProgress(Math.round(((index + 1) / validRows.length) * 100));
    }

    if (batchId) {
      try {
        await completeImportBatch(batchId, {
          status: failed === 0 ? "COMPLETED" : "COMPLETED_WITH_ERRORS",
          successRows: success,
          failedRows: failed + invalidRows.length,
        });
      } catch {
        // Preserve transaction results if the optional batch completion endpoint is unavailable.
      }
    }

    setResults({ success, failed: failed + invalidRows.length, errors });
    setCommitting(false);
  }

  function resetImport() {
    setStep(1);
    setFileName(null);
    setHeaders([]);
    setDataRows([]);
    setFieldMap(EMPTY_MAP);
    setParseError(null);
    setResults(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <section className="flex min-h-[min(690px,calc(100vh-120px))] flex-col rounded-[var(--card-radius)] border border-card-border bg-card p-5 shadow-sm sm:p-6">
      <header className="flex items-center gap-3 border-b border-card-border pb-5">
        <BookText aria-hidden="true" className="size-7 shrink-0 text-primary" />
        <div>
          <h1 className="fs-title font-bold leading-tight text-heading">Transactions</h1>
          <p className="fs-text text-muted-foreground">Import transactions</p>
        </div>
      </header>

      <nav aria-label="Import progress" className="px-2 pb-7 pt-5 sm:px-6">
        <ol className="relative grid grid-cols-4">
          <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-4 h-px bg-border" />
          {WIZARD_STEPS.map((label, index) => {
            const stepNumber = index + 1;
            const complete = stepNumber < step;
            const current = stepNumber === step;
            return (
              <li aria-current={current ? "step" : undefined} className="relative z-10 flex flex-col items-center gap-2 text-center" key={label}>
                <span className={`grid size-8 place-items-center rounded-full border-2 bg-card fs-text font-semibold ${current || complete ? "border-primary bg-primary text-white" : "border-border text-muted-foreground"}`}>
                  {stepNumber}
                </span>
                <span className={`fs-text leading-tight ${current ? "font-semibold text-primary" : "text-muted-foreground"}`}>{label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex flex-1 flex-col justify-center py-5">
        {step === 1 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <CloudUpload aria-hidden="true" className="size-14 text-primary" strokeWidth={1.8} />
            <h2 className="fs-text font-semibold text-heading">Upload Your File</h2>
            <p className="fs-text text-muted-foreground">Select a CSV file to import</p>
            <input accept=".csv,text/csv" className="sr-only" id="transaction-import-file" onChange={handleFileChange} ref={fileInputRef} type="file" />
            <Button className="mt-1 gap-2" onClick={() => fileInputRef.current?.click()} type="button">
              <CloudUpload aria-hidden="true" className="size-4" />
              Choose File
            </Button>
            <p className="fs-text text-muted-foreground">Supported format: CSV. Maximum file size: 10MB.</p>
            {fileName ? <p className="fs-text font-medium text-heading">Selected: {fileName} · {dataRows.length} rows</p> : null}
            {parseError ? <p className="fs-text text-accent-red" role="alert">{parseError}</p> : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mx-auto w-full max-w-3xl space-y-5">
            <div>
              <h2 className="fs-text font-semibold text-heading">Field Mapping</h2>
              <p className="mt-1 fs-text text-muted-foreground">Match each transaction field to a column in {fileName}.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <label className="space-y-2 fs-text font-medium text-heading" key={field.key}>
                  <span>{field.label}{field.optional ? " (optional)" : " *"}</span>
                  <select className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-card px-[var(--space-12)] fs-text font-normal" onChange={(event) => setFieldMap((current) => ({ ...current, [field.key]: event.target.value }))} value={fieldMap[field.key]}>
                    <option value="">{field.optional ? "Not mapped" : "Select a column"}</option>
                    {headers.map((header, index) => <option key={`${header}-${index}`} value={String(index)}>{header || `Column ${index + 1}`}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <label className="block max-w-md space-y-2 fs-text font-medium text-heading" htmlFor="transaction-import-reference">
              <span>Batch reference</span>
              <input className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-card px-[var(--space-12)] fs-text font-normal" id="transaction-import-reference" onChange={(event) => setReference(event.target.value)} value={reference} />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="fs-text font-semibold text-heading">Validation And Preview</h2>
                <p className="mt-1 fs-text text-muted-foreground">Review transactions and correct invalid rows before importing.</p>
              </div>
              <p className="fs-text text-heading"><span className="font-semibold text-accent-teal">{validRows.length} valid</span> · <span className="font-semibold text-accent-red">{invalidRows.length} invalid</span></p>
            </div>
            <div className="max-h-[min(420px,45vh)] overflow-auto rounded-[var(--card-radius)] border border-card-border">
              <table className="w-full min-w-[780px] text-left fs-text">
                <thead className="sticky top-0 bg-subtle font-semibold text-label"><tr><th className="px-3 py-3">Row</th><th className="px-3 py-3">Transaction reference</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Amount (minor)</th><th className="px-3 py-3">Client ID</th><th className="px-3 py-3">Validation</th></tr></thead>
                <tbody>
                  {rows.map((row) => (
                    <tr className="border-t border-card-border" key={row.rowNumber}>
                      <td className="whitespace-nowrap px-3 py-3">{row.rowNumber}</td>
                      <td className="whitespace-nowrap px-3 py-3">{row.transactionNo || "Auto-generated"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{row.type || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{row.amountMinor || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{row.clientId || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{row.valid ? <span className="inline-flex items-center gap-1 text-accent-teal"><CheckCircle2 aria-hidden="true" className="size-4" /> Valid</span> : <span className="inline-flex items-center gap-1 text-accent-red"><AlertTriangle aria-hidden="true" className="size-4" /> {row.error}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mx-auto w-full max-w-2xl space-y-5">
            <h2 className="fs-text font-semibold text-heading">{results ? "Import Result" : "Ready to Import"}</h2>
            {results ? (
              <div className="space-y-3" role="status">
                <p className="fs-text text-accent-teal">{results.success} transactions imported successfully.</p>
                {results.failed > 0 ? <p className="fs-text text-accent-red">{results.failed} rows need attention.</p> : null}
                {results.errors.length > 0 ? <ul className="list-disc space-y-1 pl-5 fs-text text-accent-red">{results.errors.slice(0, 20).map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul> : null}
                <Button onClick={resetImport} type="button" variant="outline">Start New Import</Button>
              </div>
            ) : (
              <>
                <p className="fs-text text-muted-foreground">{fileName} is ready to process. Importing these rows creates ledger transactions.</p>
                <div className="rounded-[var(--card-radius)] border border-card-border bg-subtle p-4 fs-text"><p><span className="font-semibold">{rows.length}</span> total rows</p><p><span className="font-semibold text-accent-teal">{validRows.length}</span> valid rows</p><p><span className="font-semibold text-accent-red">{invalidRows.length}</span> rows need attention</p></div>
                {committing ? <div aria-live="polite" className="space-y-2"><div className="h-2 overflow-hidden rounded-full bg-subtle"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div><p className="fs-text text-muted-foreground">Importing transactions: {progress}%</p></div> : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      {!results ? (
        <footer className="flex justify-between border-t border-card-border pt-4">
          {step > 1 ? <Button onClick={() => setStep((current) => current - 1)} type="button" variant="outline">Back</Button> : <span />}
          {step === 1 ? <Button disabled={!fileName || Boolean(parseError)} onClick={() => setStep(2)} type="button">Next <span aria-hidden="true">›</span></Button> : null}
          {step === 2 ? <Button disabled={!fieldMap.type || !fieldMap.amountMinor} onClick={() => setStep(3)} type="button">Next <span aria-hidden="true">›</span></Button> : null}
          {step === 3 ? <Button disabled={validRows.length === 0} onClick={() => setStep(4)} type="button">Next <span aria-hidden="true">›</span></Button> : null}
          {step === 4 ? <Button disabled={committing || validRows.length === 0} onClick={handleCommit} type="button">{committing ? "Importing..." : "Import Transactions"}</Button> : null}
        </footer>
      ) : null}
    </section>
  );
}
