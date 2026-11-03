"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Archive, ChevronDown, Download, Filter, Search } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { ColumnPicker, type ColumnOption } from "@/components/data/column-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { TellerWorkspaceHeader } from "@/components/transactions/teller-workspace-header";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { titleCase } from "@/lib/privacy";
import {
  getTill,
  listTransactions,
  type TillInfo,
  type Transaction,
  type TransactionList,
} from "@/lib/transactions";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load teller history.";
}

const HISTORY_COLUMNS = [
  { key: "transactionNo", label: "Transaction Id" },
  { key: "date", label: "Transaction Date" },
  { key: "type", label: "Transaction Type" },
  { key: "product", label: "Product Name" },
  { key: "client", label: "Client Name" },
  { key: "accountName", label: "Account Name" },
  { key: "accountNumber", label: "Account Number" },
  { key: "ledger", label: "Ledger" },
  { key: "debit", label: "Debit (TSh)" },
  { key: "credit", label: "Credit (TSh)" },
  { key: "balance", label: "Balance (TSh)" },
  { key: "status", label: "Status" },
] as const satisfies readonly ColumnOption<string>[];
type HistoryColumn = (typeof HISTORY_COLUMNS)[number]["key"];
const DEFAULT_HISTORY_COLUMNS = Object.fromEntries(
  HISTORY_COLUMNS.map(({ key }) => [key, true]),
) as Record<HistoryColumn, boolean>;

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
  const [visibleColumns, setVisibleColumns] =
    useState<Record<HistoryColumn, boolean>>(DEFAULT_HISTORY_COLUMNS);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listTransactions({
        from: from || undefined,
        to: to || undefined,
        q: query || undefined,
        page,
        pageSize: 20,
      })
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
      void getTill()
        .then((tillInfo) => {
          if (!cancelled) setTill(tillInfo);
        })
        .catch(() => {
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

  function exportHistory(format: "csv" | "excel") {
    const columns = HISTORY_COLUMNS.filter(({ key }) => visibleColumns[key]);
    const rows = items.map((item) =>
      columns.map(({ key }) => {
        switch (key) {
          case "transactionNo":
            return item.transactionNo;
          case "date":
            return new Date(item.createdAt).toLocaleString();
          case "type":
            return titleCase(item.type.replace(/_/g, " "));
          case "product":
            return titleCase(item.category.replace(/_/g, " "));
          case "client":
            return item.clientName || "N/A";
          case "accountName":
            return "N/A";
          case "accountNumber":
            return item.accountNumber || "N/A";
          case "ledger":
            return "N/A";
          case "debit":
            return item.drCr === "DR" ? formatTzs(item.amountMinor) : "0";
          case "credit":
            return item.drCr === "CR" ? formatTzs(item.amountMinor) : "0";
          case "balance":
            return "N/A";
          case "status":
            return titleCase(item.status);
        }
      }),
    );
    const output = [columns.map(({ label }) => label), ...rows];
    const csv = output
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const content =
      format === "csv"
        ? csv
        : `<html><head><meta charset="utf-8"></head><body><table>${output
            .map(
              (row) =>
                `<tr>${row
                  .map(
                    (value) =>
                      `<td>${String(value ?? "")
                        .replaceAll("&", "&amp;")
                        .replaceAll("<", "&lt;")
                        .replaceAll(">", "&gt;")}</td>`,
                  )
                  .join("")}</tr>`,
            )
            .join("")}</table></body></html>`;
    const mime =
      format === "csv" ? "text/csv;charset=utf-8" : "application/vnd.ms-excel;charset=utf-8";
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `teller-transaction-history.${format === "csv" ? "csv" : "xls"}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-1">
      <TellerWorkspaceHeader till={till} activeTab="history" />

      <section
        aria-label="Teller history"
        className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface"
      >
        <div aria-label="Teller history filters" className="border-b border-card-border px-4 py-3">
          <div className="grid grid-cols-1 items-end gap-2 lg:grid-cols-[200px_188px_188px_220px_38px]">
            <label className="relative block min-w-0">
              <span className="sr-only">Search teller history</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                aria-label="Search teller history"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search..."
                className="h-[34px] rounded-[6px] pl-9 fs-text"
              />
            </label>
            <label className="block fs-caption font-semibold leading-[14px] text-label">
              Start Date
              <Input
                aria-label="Start Date"
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
                className="mt-1 h-[32px] rounded-[6px] fs-caption"
                style={{ width: 153 }}
              />
            </label>
            <label className="block fs-caption font-semibold leading-[14px] text-label">
              End Date
              <Input
                aria-label="End Date"
                type="date"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
                className="mt-1 h-[32px] rounded-[6px] fs-caption"
                style={{ width: 153 }}
              />
            </label>
            <label className="block fs-caption font-semibold text-label">
              Viewing Teller
              <div
                className="mt-1 flex h-[32px] items-center justify-between rounded-[6px] border border-input bg-subtle px-2.5 fs-text text-muted-foreground"
                aria-label="Viewing teller filter unavailable"
              >
                <span className="truncate">All tellers</span>
                <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
              </div>
            </label>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Apply history filters"
              title="Apply filters"
              onClick={() => {
                setPage(1);
                setReloadKey((value) => value + 1);
              }}
              className="h-[32px] w-[38px] rounded-[6px] border-primary text-primary"
            >
              <Filter className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="mt-2 flex pb-4">
            <div className="inline-flex overflow-hidden rounded-[6px]">
              <Button
                type="button"
                onClick={() => exportHistory("csv")}
                className="h-[34px] w-[107px] justify-start rounded-none bg-primary px-3 text-primary-foreground hover:bg-primary/90"
              >
                <Download className="size-4" aria-hidden="true" /> Download
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    aria-label="Download format"
                    className="h-[34px] w-[37px] justify-center rounded-none border-l border-white/30 bg-primary px-2 text-primary-foreground hover:bg-primary/90"
                  >
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-32">
                  <DropdownMenuItem onSelect={() => exportHistory("excel")}>Excel</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => exportHistory("csv")}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => window.print()}>PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {forbidden ? (
          <ForbiddenPanel message="Your role cannot view teller history. Ask an administrator for Transaction : View." />
        ) : error ? (
          <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
        ) : loading ? (
          <div className="border-t border-card-border bg-surface">
            <PanelSkeleton rows={6} />
          </div>
        ) : (
          <div className="border-t border-card-border bg-surface">
            <div
              tabIndex={0}
              aria-label="Teller transaction history table. Scroll horizontally to view all columns."
              className="table-scroll overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
            >
              <table className="w-full min-w-[1500px] text-left fs-text">
                <thead className="border-b border-card-border bg-subtle font-semibold text-label">
                  <tr>
                    {HISTORY_COLUMNS.filter(({ key }) => visibleColumns[key]).map(
                      ({ key, label }) => (
                        <th key={key} scope="col" className="h-[44px] whitespace-nowrap px-3 py-2">
                          {label}
                        </th>
                      ),
                    )}
                    <th className="h-[44px] w-12 px-2 py-1 text-center">
                      <ColumnPicker
                        columns={[...HISTORY_COLUMNS]}
                        visible={visibleColumns}
                        onToggle={(key, checked) =>
                          setVisibleColumns((current) => ({ ...current, [key]: checked }))
                        }
                        onReset={() => setVisibleColumns(DEFAULT_HISTORY_COLUMNS)}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          HISTORY_COLUMNS.filter(({ key }) => visibleColumns[key]).length + 1
                        }
                        className="h-[172px] px-4 text-center text-[rgb(108,117,125)]"
                      >
                        <span className="flex flex-col items-center justify-center gap-3">
                          <Archive className="size-9 text-[rgb(108,117,125)]" aria-hidden="true" />
                          <span>No data available</span>
                        </span>
                      </td>
                    </tr>
                  ) : (
                    items.map((item: Transaction) => {
                      const cells: Record<HistoryColumn, ReactNode> = {
                        transactionNo: item.transactionNo,
                        date: new Date(item.createdAt).toLocaleString(),
                        type: titleCase(item.type.replace(/_/g, " ")),
                        product: titleCase(item.category.replace(/_/g, " ")),
                        client: item.clientName || "N/A",
                        accountName: "N/A",
                        accountNumber: item.accountNumber || "N/A",
                        ledger: "N/A",
                        debit: item.drCr === "DR" ? formatTzs(item.amountMinor) : "0",
                        credit: item.drCr === "CR" ? formatTzs(item.amountMinor) : "0",
                        balance: "N/A",
                        status: (
                          <Badge variant={item.status === "APPROVED" ? "default" : "outline"}>
                            {titleCase(item.status)}
                          </Badge>
                        ),
                      };
                      return (
                        <tr key={item.id} className="border-b border-card-border last:border-0">
                          {HISTORY_COLUMNS.filter(({ key }) => visibleColumns[key]).map(
                            ({ key }) => (
                              <td key={key} className="whitespace-nowrap px-3 py-3 text-body">
                                {cells[key]}
                              </td>
                            ),
                          )}
                          <td />
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-4 py-3 fs-text text-muted-foreground">
              <span>
                Showing {items.length ? (page - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(page * pageSize, data?.total ?? 0)} of {data?.total ?? 0} entries
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
