"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { getLoan, type Loan, type LoanScheduleRow } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export default function LoanSchedulePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [loan, setLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<LoanScheduleRow[]>([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset loading when a different loan ID is selected.
    setLoading(true);
    setError(null);
    void getLoan(id)
      .then((response) => {
        if (cancelled) return;
        setLoan(response.loan);
        setSchedule(response.schedule);
        setForbidden(false);
      })
      .catch((failure: unknown) => {
        if (cancelled) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else setError(message(failure, "Could not load this loan schedule."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const visibleRows = useMemo(
    () => status === "ALL" ? schedule : schedule.filter((row) => row.status === status),
    [schedule, status],
  );

  function downloadSchedule() {
    const header = ["Installment", "Status", "Due date", "Paid date", "Principal", "Interest", "Amount due", "Closing principal"];
    const rows = visibleRows.map((row) => [
      String(row.installmentNo),
      titleCase(row.status),
      new Date(row.dueDate).toLocaleDateString(),
      row.paidAt ? new Date(row.paidAt).toLocaleDateString() : "",
      formatTzs(row.principalMinor),
      formatTzs(row.interestMinor),
      formatTzs(row.totalMinor),
      formatTzs(row.closingPrincipalMinor),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${loan?.loanNumber ?? "loan"}-schedule.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const tabs = [
    { label: "Summary", href: `/account-loan-details/${id}` },
    { label: "Transactions", href: `/account-loan-details/${id}/transactions` },
    { label: "Schedule", href: `/account-loan-details/${id}/schedule` },
    { label: "Repayments", href: `/account-loan-details/${id}/repayments` },
    { label: "Guarantors", href: `/account-loan-details/${id}/guarantors` },
    { label: "Documents", href: `/account-loan-details/${id}/documents` },
  ];

  if (forbidden) {
    return <div className="space-y-5"><PageHeader title="Loan repayment schedule" /><ForbiddenPanel message="Your role cannot view loans. Ask an administrator for Loan Account : View." /></div>;
  }
  if (loading) {
    return <div className="space-y-5"><PageHeader title="Loan repayment schedule" /><section className="rounded-[var(--card-radius)] border border-card-border bg-surface"><PanelSkeleton rows={8} /></section></div>;
  }
  if (error || !loan) {
    return <div className="space-y-5"><PageHeader title="Loan repayment schedule" /><ErrorPanel message={error ?? "Could not load this loan schedule."} /></div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        variant="card"
        title={`Loan ${loan.loanNumber}`}
        actions={<Badge variant={loan.status === "ACTIVE" ? "default" : "outline"}>{titleCase(loan.status)}</Badge>}
      />

      <nav aria-label="Loan details" className="flex overflow-x-auto border-b border-card-border bg-surface">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={tab.label === "Schedule" ? "page" : undefined}
            className={`shrink-0 border-b-2 px-4 py-3 fs-text font-medium ${tab.label === "Schedule" ? "border-primary text-primary" : "border-transparent text-body hover:bg-subtle"}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <h2 className="fs-text font-semibold text-strong">Loan repayment schedule</h2>
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter schedule status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"
            >
              <option value="ALL">All</option>
              {[...new Set(schedule.map((row) => row.status))].map((value) => (
                <option key={value} value={value}>{titleCase(value)}</option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={downloadSchedule} disabled={visibleRows.length === 0}>
              <Download className="size-4" aria-hidden="true" />
              Download
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left fs-text">
            <thead className="border-y border-card-border bg-subtle font-semibold tracking-wide text-label">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due date</th>
                <th className="px-4 py-3">Payment date</th>
                <th className="px-4 py-3 text-right">Principal</th>
                <th className="px-4 py-3 text-right">Interest</th>
                <th className="px-4 py-3 text-right">Due</th>
                <th className="px-4 py-3 text-right">Closing principal</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No schedule rows are available.</td></tr>
              ) : visibleRows.map((row) => (
                <tr key={row.id} className="border-b border-card-border last:border-0">
                  <td className="px-4 py-3">{row.installmentNo}</td>
                  <td className="px-4 py-3"><Badge variant={row.status === "PAID" ? "default" : "outline"}>{titleCase(row.status)}</Badge></td>
                  <td className="px-4 py-3">{new Date(row.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{row.paidAt ? new Date(row.paidAt).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatTzs(row.principalMinor)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatTzs(row.interestMinor)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatTzs(row.totalMinor)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatTzs(row.closingPrincipalMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
