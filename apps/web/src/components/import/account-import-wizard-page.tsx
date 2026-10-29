"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { createSavingsAccount } from "@/lib/settings";
import { createImportBatch, completeImportBatch } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

type ParsedRow = {
  accountNumber: string;
  clientId: string;
  accountType: string;
  balanceMinor: string;
  valid: boolean;
  error: string | null;
};

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase().split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const accIdx = header.findIndex((c) => /account/.test(c));
  const clientIdx = header.findIndex((c) => /client/.test(c));
  const typeIdx = header.findIndex((c) => /type/.test(c));
  const balIdx = header.findIndex((c) => /balance/.test(c));
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const accountNumber = (accIdx >= 0 ? cells[accIdx] : cells[0]) ?? "";
    const clientId = (clientIdx >= 0 ? cells[clientIdx] : cells[1]) ?? "";
    const accountType = (typeIdx >= 0 ? cells[typeIdx] : "PRIMARY") ?? "PRIMARY";
    const balanceMinor = (balIdx >= 0 ? cells[balIdx] : "0") ?? "0";
    let valid = true;
    let error: string | null = null;
    if (!accountNumber) { valid = false; error = "Missing account number"; }
    else if (!clientId) { valid = false; error = "Missing client ID"; }
    rows.push({ accountNumber, clientId, accountType, balanceMinor, valid, error });
  }
  return rows;
}

export function AccountImportWizardPage() {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [reference, setReference] = useState(`ACC-IMP-${Date.now()}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCsv(String(reader.result ?? ""));
        setRows(parsed);
        if (parsed.length === 0) setParseError("No data rows found in the file.");
      } catch (e) {
        setParseError(e instanceof Error ? e.message : "Failed to parse file.");
      }
    };
    reader.readAsText(file);
  }

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

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
        kind: "ACCOUNT",
        fileName: fileName ?? "unknown.csv",
        totalRows: rows.length,
      });
      batchId = batch.id;
    } catch {
      // continue
    }
    for (let i = 0; i < validRows.length; i += 1) {
      const row = validRows[i];
      try {
        await createSavingsAccount({
          clientId: row.clientId,
          accountNumber: row.accountNumber,
          accountType: row.accountType,
        });
        success += 1;
      } catch (e) {
        failed += 1;
        errors.push(`${row.accountNumber}: ${e instanceof Error ? e.message : "failed"}`);
      }
      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }
    if (batchId) {
      try {
        await completeImportBatch(batchId, {
          status: failed === 0 ? "COMPLETED" : "COMPLETED_WITH_ERRORS",
          successRows: success,
          failedRows: failed + invalidRows.length,
        });
      } catch {
        // ignore
      }
    }
    setResults({ success, failed: failed + invalidRows.length, errors });
    setCommitting(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Account import wizard" description="Upload, map, validate and commit account data." breadcrumb="Import" />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className={`grid size-8 place-items-center rounded-full ${step >= 1 ? "bg-primary text-white" : "bg-subtle text-muted-foreground"} fs-text font-bold`}>1</span>
          <span className="fs-text font-medium text-body">Upload</span>
          <span className="mx-2 text-muted-foreground">→</span>
          <span className={`grid size-8 place-items-center rounded-full ${step >= 2 ? "bg-primary text-white" : "bg-subtle text-muted-foreground"} fs-text font-bold`}>2</span>
          <span className="fs-text font-medium text-body">Preview</span>
          <span className="mx-2 text-muted-foreground">→</span>
          <span className={`grid size-8 place-items-center rounded-full ${step >= 3 ? "bg-primary text-white" : "bg-subtle text-muted-foreground"} fs-text font-bold`}>3</span>
          <span className="fs-text font-medium text-body">Commit</span>
        </div>
      </section>

      {step === 1 ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4 space-y-3">
          <h2 className="fs-text font-bold text-strong">Upload CSV file</h2>
          <p className="fs-text text-muted-foreground">CSV columns: accountNumber, clientId, accountType, balanceMinor.</p>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="batch-ref">Batch reference</label>
            <Input id="batch-ref" value={reference} onChange={(event) => setReference(event.target.value)} className="h-[var(--control-height)] max-w-md" />
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="block fs-text text-body file:mr-3 file:rounded-[var(--control-radius)] file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:fs-text" />
          </div>
          {parseError ? <p className="fs-text text-accent-red" role="alert">{parseError}</p> : null}
          {rows.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="fs-text text-body">{rows.length} rows parsed · {validRows.length} valid · {invalidRows.length} invalid</span>
              <Button type="button" onClick={() => setStep(2)}>Preview</Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4 space-y-3">
          <h2 className="fs-text font-bold text-strong">Preview and validate</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Account number</th>
                  <th className="whitespace-nowrap px-4 py-3">Client ID</th>
                  <th className="whitespace-nowrap px-4 py-3">Type</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{row.accountNumber || "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{row.clientId || "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{row.accountType}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.valid ? (
                        <span className="inline-flex items-center gap-1.5 text-accent-teal"><CheckCircle2 className="size-4" aria-hidden="true" /> Valid</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-accent-red"><AlertTriangle className="size-4" aria-hidden="true" /> {row.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="fs-text text-body">{validRows.length} valid · {invalidRows.length} invalid</span>
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button type="button" onClick={() => setStep(3)} disabled={validRows.length === 0}>Commit</Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4 space-y-3">
          <h2 className="fs-text font-bold text-strong">Commit import</h2>
          <p className="fs-text text-body">{validRows.length} valid rows will be imported.</p>
          {committing ? (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-subtle">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="fs-text text-muted-foreground">{progress}% complete</p>
            </div>
          ) : null}
          {results ? (
            <div className="space-y-2">
              <p className="fs-text text-accent-teal" role="status">{results.success} accounts imported successfully.</p>
              {results.failed > 0 ? <p className="fs-text text-accent-red" role="alert">{results.failed} rows failed.</p> : null}
              {results.errors.length > 0 ? (
                <ul className="list-disc pl-5 fs-text text-accent-red">
                  {results.errors.slice(0, 20).map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              ) : null}
              <Button type="button" variant="outline" onClick={() => { setStep(1); setRows([]); setResults(null); setFileName(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Start new import</Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={committing}>Back</Button>
              <Button type="button" onClick={handleCommit} disabled={committing}>{committing ? "Importing..." : "Commit import"}</Button>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
