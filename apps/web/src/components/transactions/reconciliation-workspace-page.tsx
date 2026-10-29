"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import { listTransactions, type Transaction, type TransactionList } from "@/lib/transactions";

type StatementLine = {
  reference: string;
  amountMinor: string;
  date: string;
  description: string;
};

type MatchResult = {
  line: StatementLine;
  matched: Transaction | null;
};

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load reconciliation data.";
}

function parseCsv(text: string): StatementLine[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase().split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
  const refIndex = header.findIndex((cell) => /ref|reference|id/.test(cell));
  const amountIndex = header.findIndex((cell) => /amount/.test(cell));
  const dateIndex = header.findIndex((cell) => /date/.test(cell));
  const descIndex = header.findIndex((cell) => /desc|narration|memo/.test(cell));
  const result: StatementLine[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i].split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const reference = refIndex >= 0 ? cells[refIndex] ?? "" : cells[0] ?? "";
    const amountRaw = amountIndex >= 0 ? cells[amountIndex] ?? "0" : cells[1] ?? "0";
    const amountMinor = String(Math.round(Number(amountRaw) * 100));
    const date = dateIndex >= 0 ? cells[dateIndex] ?? "" : "";
    const description = descIndex >= 0 ? cells[descIndex] ?? "" : "";
    if (!reference && !amountRaw) continue;
    result.push({ reference, amountMinor, date, description });
  }
  return result;
}

export function ReconciliationWorkspacePage() {
  const [transactions, setTransactions] = useState<TransactionList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [statementLines, setStatementLines] = useState<StatementLine[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listTransactions({ page: 1, pageSize: 100 })
        .then((next) => {
          if (cancelled) return;
          setTransactions(next);
          setForbidden(false);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) {
            setForbidden(true);
            setTransactions(null);
          } else {
            setError(failureMessage(failure));
          }
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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = parseCsv(text);
      setStatementLines(lines);
      const items = transactions?.items ?? [];
      const results: MatchResult[] = lines.map((line) => {
        const matched = items.find(
          (transaction) =>
            transaction.transactionNo === line.reference ||
            transaction.externalRef === line.reference ||
            (transaction.amountMinor === line.amountMinor && line.amountMinor !== "0"),
        ) ?? null;
        return { line, matched };
      });
      setMatches(results);
    };
    reader.readAsText(file);
  }

  function clearStatement() {
    setStatementLines([]);
    setMatches([]);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const matchedCount = matches.filter((item) => item.matched).length;
  const unmatchedCount = matches.length - matchedCount;
  const items = transactions?.items ?? [];

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Reconciliation workspace" description="Upload a provider or bank statement and match lines to transactions." />
        <ForbiddenPanel message="Your role cannot view reconciliation. Ask an administrator for Transaction : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reconciliation workspace"
        description="Upload a provider or bank statement, match lines to transactions and resolve unmatched items."
      />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
        <h2 className="mb-3 fs-text font-bold text-strong">Upload statement</h2>
        <div className="flex flex-wrap items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block fs-text text-body file:mr-3 file:rounded-[var(--control-radius)] file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:fs-text"
          />
          {fileName ? (
            <Button type="button" variant="outline" size="sm" onClick={clearStatement}>
              Clear
            </Button>
          ) : null}
        </div>
        <p className="mt-2 fs-text text-muted-foreground">
          CSV columns: reference, amount, date, description. Matching uses reference first, then amount.
        </p>
      </section>

      {matches.length > 0 ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <Badge variant="default">{matchedCount} matched</Badge>
            <Badge variant={unmatchedCount > 0 ? "destructive" : "outline"}>{unmatchedCount} unmatched</Badge>
            <span className="fs-text text-muted-foreground">{matches.length} statement lines</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Statement reference</th>
                  <th className="whitespace-nowrap px-4 py-3">Amount</th>
                  <th className="whitespace-nowrap px-4 py-3">Date</th>
                  <th className="whitespace-nowrap px-4 py-3">Matched transaction</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((item, index) => (
                  <tr key={index} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.line.reference || "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(item.line.amountMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.line.date || "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">
                      {item.matched ? item.matched.transactionNo : "No match"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {item.matched ? (
                        <span className="inline-flex items-center gap-1.5 text-accent-teal">
                          <CheckCircle2 className="size-4" aria-hidden="true" /> Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-accent-red">
                          <AlertTriangle className="size-4" aria-hidden="true" /> Unmatched
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : statementLines.length === 0 && !fileName ? (
        <EmptyState
          icon={Upload}
          title="No statement loaded"
          description="Upload a CSV statement to begin matching."
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="fs-text font-bold text-strong">Posted transactions</h2>
        {loading ? (
          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
            <PanelSkeleton rows={6} />
          </section>
        ) : items.length === 0 ? (
          <EmptyState icon={Upload} title="No transactions" description="Posted transactions will appear here for matching." />
        ) : (
          <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left fs-text">
                <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3">Reference</th>
                    <th className="whitespace-nowrap px-4 py-3">Type</th>
                    <th className="whitespace-nowrap px-4 py-3">Amount</th>
                    <th className="whitespace-nowrap px-4 py-3">Accounting</th>
                    <th className="whitespace-nowrap px-4 py-3">Client</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-card-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.transactionNo}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(item.type.replace(/_/g, " "))}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(item.amountMinor)}</td>
                      <td className="whitespace-nowrap px-4 py-3"><Badge variant={item.accountingStatus === "POSTED" ? "default" : "outline"}>{titleCase(item.accountingStatus)}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3 text-body">{item.clientName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
