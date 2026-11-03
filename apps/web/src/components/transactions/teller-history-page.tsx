"use client";

import { useEffect, useState } from "react";
import { Download, Search, SlidersHorizontal } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TellerWorkspaceHeader } from "@/components/transactions/teller-workspace-header";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import { getTill, listTransactions, type TillInfo, type Transaction, type TransactionList } from "@/lib/transactions";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load teller history.";
}

export function TellerHistoryPage() {
  const [data, setData] = useState<TransactionList | null>(null);
  const [till, setTill] = useState<TillInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listTransactions({ from: from || undefined, to: to || undefined, q: query || undefined, page, pageSize: 20 })
        .then((next) => {
          if (cancelled) return;
          setData(next);
          setForbidden(false);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) {
            setForbidden(true);
            setData(null);
          } else {
            setError(failureMessage(failure));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      void getTill().then((tillInfo) => {
        if (!cancelled) setTill(tillInfo);
      }).catch(() => {
        if (!cancelled) setTill(null);
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [from, to, query, page, reloadKey]);

  const items = data?.items ?? [];
  const pageSize = data?.pageSize ?? 20;
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  function exportHistory() {
    const columns = ["Date", "Session Date", "Member Name", "Transaction Number", "Account Number", "Type", "Amount (TSh)", "Transaction Status", "Transaction Reference ID", "Product Name", "Source", "Comment", "User"];
    const rows = items.map((item) => [item.createdAt, item.valueDate, item.clientName, item.transactionNo, item.accountNumber, item.type, item.amountMinor, item.status, item.receiptNo || item.externalRef, item.category, item.paymentMethod, item.narration, item.tellerName]);
    const csv = [columns, ...rows].map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "teller-transaction-history.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <TellerWorkspaceHeader till={till} activeTab="history" />

      <section aria-label="Teller history filters" className="flex flex-wrap items-center gap-2 rounded-[var(--card-radius)] border border-card-border bg-surface p-3">
        <div className="relative min-w-[190px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Search teller history" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search" className="h-[35px] rounded-[6px] border-primary pl-8 fs-text" />
        </div>
        <Input aria-label="Start Date" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="h-[35px] w-[150px] rounded-[6px] border-primary fs-caption" />
        <Input aria-label="End Date" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="h-[35px] w-[150px] rounded-[6px] border-primary fs-caption" />
        <Button type="button" variant="outline" size="sm" onClick={exportHistory} className="h-[35px] rounded-[6px] border-primary text-primary"><Download className="size-3.5" aria-hidden="true" /> Export</Button>
      </section>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view teller history. Ask an administrator for Transaction : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={6} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState icon={Search} title="No transactions found" description="Teller transactions matching these filters will appear here." />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Date</th>
                  <th className="whitespace-nowrap px-4 py-3">Session Date</th>
                  <th className="whitespace-nowrap px-4 py-3">Member Name</th>
                  <th className="whitespace-nowrap px-4 py-3">Transaction Number</th>
                  <th className="whitespace-nowrap px-4 py-3">Account Number</th>
                  <th className="whitespace-nowrap px-4 py-3">Type</th>
                  <th className="whitespace-nowrap px-4 py-3">Amount (TSh)</th>
                  <th className="whitespace-nowrap px-4 py-3">Transaction Status</th>
                  <th className="whitespace-nowrap px-4 py-3">Transaction Reference ID</th>
                  <th className="whitespace-nowrap px-4 py-3">Product Name</th>
                  <th className="whitespace-nowrap px-4 py-3">Source</th>
                  <th className="whitespace-nowrap px-4 py-3">Comment</th>
                  <th className="whitespace-nowrap px-4 py-3">User</th>
                  <th className="w-12 px-2 py-3 text-center"><Button type="button" variant="ghost" size="icon-sm" disabled aria-label="Table columns" className="disabled:opacity-100 disabled:text-primary"><SlidersHorizontal className="size-3.5" aria-hidden="true" /></Button></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: Transaction) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.valueDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.clientName || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.transactionNo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.accountNumber || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(item.type.replace(/_/g, " "))}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(item.amountMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Badge variant={item.status === "APPROVED" ? "default" : "outline"}>{titleCase(item.status)}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.receiptNo || item.externalRef || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(item.category.replace(/_/g, " "))}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(item.paymentMethod.replace(/_/g, " "))}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.narration || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.tellerName || "—"}</td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-4 py-3 fs-text text-muted-foreground">
            <span>{data?.total ?? 0} transactions</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <span>Page {page} of {pageCount}</span>
              <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
