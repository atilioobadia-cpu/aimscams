"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CloudUpload, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createImportBatch, completeImportBatch, createClient } from "@/lib/settings";
import { parseCsv } from "@/lib/csv";

type MemberField = "referenceNo" | "fullName" | "clientType" | "phone" | "nationalId";
type MemberRow = {
  rowNumber: number;
  referenceNo: string;
  fullName: string;
  clientType: string;
  phone: string;
  nationalId: string;
  valid: boolean;
  error: string | null;
};
type FieldMap = Record<MemberField, string>;
type ImportResult = { success: number; failed: number; errors: string[] };

const WIZARD_STEPS = ["Upload File", "Field Mapping", "Validation And Preview", "Result"];
const FIELDS: { key: MemberField; label: string; optional: boolean; match: RegExp }[] = [
  { key: "referenceNo", label: "Reference Number", optional: true, match: /reference|ref(?:erence)? ?no/ },
  { key: "fullName", label: "Full Name", optional: false, match: /full ?name|member ?name|name/ },
  { key: "clientType", label: "Client Type", optional: true, match: /client ?type|member ?type|type/ },
  { key: "phone", label: "Phone Number", optional: true, match: /phone|mobile|telephone/ },
  { key: "nationalId", label: "National ID", optional: true, match: /national|identity|(^| )id($| )/ },
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const EMPTY_MAP: FieldMap = { referenceNo: "", fullName: "", clientType: "", phone: "", nationalId: "" };

function detectFieldMap(headers: string[]): FieldMap {
  const map = { ...EMPTY_MAP };
  for (const field of FIELDS) {
    const index = headers.findIndex((header) => field.match.test(header.toLowerCase().replace(/[_-]/g, " ")));
    if (index >= 0) map[field.key] = String(index);
  }
  return map;
}

function mapMemberRows(dataRows: string[][], mapping: FieldMap): MemberRow[] {
  const getValue = (cells: string[], field: MemberField) => {
    const index = Number(mapping[field]);
    return mapping[field] && Number.isInteger(index) ? (cells[index] ?? "").trim() : "";
  };

  return dataRows.map((cells, index) => {
    const referenceNo = getValue(cells, "referenceNo");
    const fullName = getValue(cells, "fullName");
    const clientType = getValue(cells, "clientType").toUpperCase() || "INDIVIDUAL";
    const phone = getValue(cells, "phone");
    const nationalId = getValue(cells, "nationalId");
    let error: string | null = null;
    if (!fullName) error = "Full name is required";
    else if (clientType !== "INDIVIDUAL" && clientType !== "GROUP") error = "Client type must be Individual or Group";

    return { rowNumber: index + 2, referenceNo, fullName, clientType, phone, nationalId, valid: error === null, error };
  });
}

export function MemberImportWizardPage() {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [fieldMap, setFieldMap] = useState<FieldMap>(EMPTY_MAP);
  const [parseError, setParseError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult | null>(null);
  const [reference, setReference] = useState(`IMP-${Date.now()}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rows = mapMemberRows(dataRows, fieldMap);
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
        setParseError("The file needs a header row and at least one member row.");
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
      const batch = await createImportBatch({
        reference,
        kind: "MEMBER",
        fileName: fileName ?? "members.csv",
        totalRows: rows.length,
      });
      batchId = batch.id;
    } catch {
      // Continue with member creation if the optional batch endpoint is unavailable.
    }

    for (let index = 0; index < validRows.length; index += 1) {
      const row = validRows[index];
      try {
        await createClient({
          referenceNo: row.referenceNo || undefined,
          fullName: row.fullName,
          clientType: row.clientType as "INDIVIDUAL" | "GROUP",
          phone: row.phone || undefined,
          nationalId: row.nationalId || undefined,
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
        // Preserve member results if the optional batch completion endpoint is unavailable.
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
        <UsersRound aria-hidden="true" className="size-7 shrink-0 text-primary" />
        <div>
          <h1 className="fs-title font-bold leading-tight text-heading">Members</h1>
          <p className="fs-text text-muted-foreground">Import credit union members with user relationships</p>
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
            <input
              accept=".csv,text/csv"
              className="sr-only"
              id="member-import-file"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
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
              <p className="mt-1 fs-text text-muted-foreground">Match each member field to a column in {fileName}.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <label className="space-y-2 fs-text font-medium text-heading" key={field.key}>
                  <span>{field.label}{field.optional ? " (optional)" : " *"}</span>
                  <select
                    className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-card px-[var(--space-12)] fs-text font-normal"
                    onChange={(event) => setFieldMap((current) => ({ ...current, [field.key]: event.target.value }))}
                    value={fieldMap[field.key]}
                  >
                    <option value="">{field.optional ? "Not mapped" : "Select a column"}</option>
                    {headers.map((header, index) => <option key={`${header}-${index}`} value={String(index)}>{header || `Column ${index + 1}`}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <label className="block max-w-md space-y-2 fs-text font-medium text-heading" htmlFor="member-import-reference">
              <span>Batch reference</span>
              <input className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-card px-[var(--space-12)] fs-text font-normal" id="member-import-reference" onChange={(event) => setReference(event.target.value)} value={reference} />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="fs-text font-semibold text-heading">Validation And Preview</h2>
                <p className="mt-1 fs-text text-muted-foreground">Review mapped members and fix rows with errors before importing.</p>
              </div>
              <p className="fs-text text-heading"><span className="font-semibold text-accent-teal">{validRows.length} valid</span> · <span className="font-semibold text-accent-red">{invalidRows.length} invalid</span></p>
            </div>
            <div className="max-h-[min(420px,45vh)] overflow-auto rounded-[var(--card-radius)] border border-card-border">
              <table className="w-full min-w-[720px] text-left fs-text">
                <thead className="sticky top-0 bg-subtle font-semibold text-label">
                  <tr>
                    <th className="px-3 py-3">Row</th>
                    <th className="px-3 py-3">Reference Number</th>
                    <th className="px-3 py-3">Full Name</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Phone</th>
                    <th className="px-3 py-3">Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr className="border-t border-card-border" key={row.rowNumber}>
                      <td className="whitespace-nowrap px-3 py-3">{row.rowNumber}</td>
                      <td className="whitespace-nowrap px-3 py-3">{row.referenceNo || "Auto-generated"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{row.fullName || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{row.clientType}</td>
                      <td className="whitespace-nowrap px-3 py-3">{row.phone || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {row.valid ? (
                          <span className="inline-flex items-center gap-1 text-accent-teal"><CheckCircle2 aria-hidden="true" className="size-4" /> Valid</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-accent-red"><AlertTriangle aria-hidden="true" className="size-4" /> {row.error}</span>
                        )}
                      </td>
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
                <p className="fs-text text-accent-teal">{results.success} members imported successfully.</p>
                {results.failed > 0 ? <p className="fs-text text-accent-red">{results.failed} rows need attention.</p> : null}
                {results.errors.length > 0 ? <ul className="list-disc space-y-1 pl-5 fs-text text-accent-red">{results.errors.slice(0, 20).map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul> : null}
                <Button onClick={resetImport} type="button" variant="outline">Start New Import</Button>
              </div>
            ) : (
              <>
                <p className="fs-text text-muted-foreground">{fileName} is ready to process. Only valid rows will be imported.</p>
                <div className="rounded-[var(--card-radius)] border border-card-border bg-subtle p-4 fs-text">
                  <p><span className="font-semibold">{rows.length}</span> total rows</p>
                  <p><span className="font-semibold text-accent-teal">{validRows.length}</span> valid rows</p>
                  <p><span className="font-semibold text-accent-red">{invalidRows.length}</span> rows need attention</p>
                </div>
                {committing ? (
                  <div aria-live="polite" className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-subtle"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
                    <p className="fs-text text-muted-foreground">Importing members: {progress}%</p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      {!results ? (
        <footer className="flex justify-between border-t border-card-border pt-4">
          {step > 1 ? <Button onClick={() => setStep((current) => current - 1)} type="button" variant="outline">Back</Button> : <span />}
          {step === 1 ? (
            <Button disabled={!fileName || Boolean(parseError)} onClick={() => setStep(2)} type="button">Next <span aria-hidden="true">›</span></Button>
          ) : null}
          {step === 2 ? (
            <Button disabled={!FIELDS.some((field) => field.key === "fullName" && fieldMap[field.key] !== "")} onClick={() => setStep(3)} type="button">Next <span aria-hidden="true">›</span></Button>
          ) : null}
          {step === 3 ? <Button disabled={validRows.length === 0} onClick={() => setStep(4)} type="button">Next <span aria-hidden="true">›</span></Button> : null}
          {step === 4 ? <Button disabled={committing || validRows.length === 0} onClick={handleCommit} type="button">{committing ? "Importing..." : "Import Members"}</Button> : null}
        </footer>
      ) : null}
    </section>
  );
}
