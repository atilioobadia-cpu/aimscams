"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { createTransaction } from "@/lib/transactions";
import { createImportBatch, completeImportBatch } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

type ParsedRow = {
  transactionNo: string;
  type: string;
  amountMinor: string;
  clientId: string;
  valid: boolean;
  error: string | null;
};

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase().split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const noIdx = header.findIndex((c) => /no|reference/.test(c));
  const typeIdx = header.findIndex((c) => /type/.test(c));
  const amtIdx = header.findIndex((c) => /amount/.test(c));
  const clientIdx = header.findIndex((c) => /client/.test(c));
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const transactionNo = (noIdx >= 0 ? cells[noIdx] : cells[0]) ?? "";
    const type = (typeIdx >= 0 ? cells[typeIdx] : "SAVINGS_DEPOSIT") ?? "SAVINGS_DEPOSIT";
    const amountMinor = (amtIdx >= 0 ? cells[amtIdx] : "0") ?? "0";
    const clientId = (clientIdx >= 0 ? cells[clientIdx] : "") ?? "";
    let valid = true;
    let error: string | null = null;
    if (!transactionNo) { valid = false; error = "Missing transaction number"; }
    else if (!/^\d+$/.test(amountMinor)) { valid = false; error = "Invalid amount"; }
    rows.push({ transactionNo, type, amountMinor, clientId, valid, error });
  }
  return rows;
}

export function TransactionImportWizardPage() {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [reference, setReference] = useState(`TXN-IMP-${Date.now()}`);
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
        kind: "TRANSACTION",
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
        await createTransaction({
          type: row.type,
          amountMinor: row.amountMinor,
          clientId: row.clientId || undefined,
        });
        success += 1;
      } catch (e) {
        failed += 1;
        errors.push(`${row.transactionNo}: ${e instanceof Error ? e.message : "failed"}`);
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
      <PageHeader title="Transaction import wizard" description="Upload, map, validate and commit transaction data." breadcrumb="Import" />

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
          <p className="fs-text text-muted-foreground">CSV columns: transactionNo, type, amountMinor, clientId.</p>
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
                  <th className="whitespace-nowrap px-4 py-3">Transaction number</th>
                  <th className="whitespace-nowrap px-4 py-3">Type</th>
                  <th className="whitespace-nowrap px-4 py-3">Amount (minor)</th>
                  <th className="whitespace-nowrap px-4 py-3">Client ID</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{row.transactionNo || "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{row.type}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{row.amountMinor}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{row.clientId || "N/A"}</td>
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
              <p className="fs-text text-accent-teal" role="status">{results.success} transactions imported successfully.</p>
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
