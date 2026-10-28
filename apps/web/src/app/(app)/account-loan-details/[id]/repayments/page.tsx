"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import { getLoan, type LoanScheduleRow } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function LoanRepaymentsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loanNumber, setLoanNumber] = useState<string>("");
  const [schedule, setSchedule] = useState<LoanScheduleRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getLoan(id)
      .then((response) => {
        if (cancelled) return;
        setLoanNumber(response.loan.loanNumber);
        setSchedule(response.schedule);
        setForbidden(false);
      })
      .catch((failure: unknown) => {
        if (cancelled) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setForbidden(true);
        } else {
          setError(message(failure, "Could not load repayment history."));
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Repayment history" description="Repayments recorded against this loan." />
        <ForbiddenPanel message="Your role cannot view loans. Ask an administrator for Loan Account : View." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Repayment history" description="Repayments recorded against this loan." />
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="Repayment history" description="Repayments recorded against this loan." />
        <ErrorPanel message={error} />
      </div>
    );
  }

  const paid = schedule.filter((row) => row.paidAt || row.status === "PAID");

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/account-loan-details/${id}`}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Loan {loanNumber}
          </Link>
        </Button>
      </div>

      <PageHeader title={`Repayment history · ${loanNumber}`} description="Repayments recorded against this loan." />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        {paid.length === 0 ? (
          <EmptyState icon={Building2} title="No repayments recorded" description="Repayments will appear here once they are posted." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Due date</th>
                  <th className="px-4 py-3">Paid on</th>
                  <th className="px-4 py-3">Principal</th>
                  <th className="px-4 py-3">Interest</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paid.map((row) => (
                  <tr key={row.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-body">{row.installmentNo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(row.dueDate).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">
                      {row.paidAt ? new Date(row.paidAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(row.principalMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(row.interestMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(row.totalMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={row.status === "PAID" ? "default" : "outline"}>{titleCase(row.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
