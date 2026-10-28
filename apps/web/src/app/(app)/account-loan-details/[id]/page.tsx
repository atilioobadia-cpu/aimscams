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
import { getLoan, type Loan, type LoanScheduleRow } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<LoanScheduleRow[]>([]);

  useEffect(() => {
    let cancelled = false;
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
        if (failure instanceof ApiError && failure.status === 403) {
          setForbidden(true);
        } else {
          setError(message(failure, "Could not load this loan."));
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
        <PageHeader title="Loan" description="Loan details." />
        <ForbiddenPanel message="Your role cannot view loans. Ask an administrator for Loan Account : View." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loan" description="Loan details." />
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={10} />
        </section>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loan" description="Loan details." />
        <ErrorPanel message={error ?? "Could not load this loan."} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/account-loan">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Loans
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title={`Loan ${loan.loanNumber}`} description="Loan summary and repayment schedule." />
        <Badge variant={loan.status === "ACTIVE" ? "default" : "outline"}>{titleCase(loan.status)}</Badge>
      </div>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <h2 className="mb-3 fs-text font-semibold text-strong">Summary</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Client</dt>
            <dd className="mt-0.5 fs-text text-body">{loan.clientName ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Product</dt>
            <dd className="mt-0.5 fs-text text-body">{loan.productName ?? loan.productCode ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Application</dt>
            <dd className="mt-0.5 fs-text text-body">{loan.applicationNo ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Principal</dt>
            <dd className="mt-0.5 fs-text tabular-nums text-body">{formatTzs(loan.principalMinor)}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Outstanding</dt>
            <dd className="mt-0.5 fs-text tabular-nums text-body">{formatTzs(loan.outstandingPrincipalMinor)}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Tenure</dt>
            <dd className="mt-0.5 fs-text text-body">{loan.tenureCount} {loan.tenurePeriod.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Interest rate</dt>
            <dd className="mt-0.5 fs-text tabular-nums text-body">{(loan.interestRateBp / 100).toFixed(2)}%</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Interest method</dt>
            <dd className="mt-0.5 fs-text text-body">{titleCase(loan.interestMethod.replace(/_/g, " "))}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Installment start</dt>
            <dd className="mt-0.5 fs-text text-body">{loan.installmentStartDate ? new Date(loan.installmentStartDate).toLocaleDateString() : "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Classification</dt>
            <dd className="mt-0.5 fs-text text-body">{loan.classification ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Days past due</dt>
            <dd className="mt-0.5 fs-text text-body">{loan.daysPastDue}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Created</dt>
            <dd className="mt-0.5 fs-text text-body">{new Date(loan.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <h2 className="mb-3 fs-text font-semibold text-strong">Repayment schedule</h2>
        {schedule.length === 0 ? (
          <EmptyState icon={Building2} title="No schedule" description="No repayment schedule was generated." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Due date</th>
                  <th className="px-4 py-3">Opening</th>
                  <th className="px-4 py-3">Principal</th>
                  <th className="px-4 py-3">Interest</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Closing</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-body">{row.installmentNo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(row.dueDate).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(row.openingPrincipalMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(row.principalMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(row.interestMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(row.totalMinor)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body">{formatTzs(row.closingPrincipalMinor)}</td>
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