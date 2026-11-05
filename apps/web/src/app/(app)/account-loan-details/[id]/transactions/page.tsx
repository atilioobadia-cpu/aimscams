"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getLoan } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function LoanTransactionsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const isValidLoanId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  const [loading, setLoading] = useState(isValidLoanId);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [loanNumber, setLoanNumber] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    if (!isValidLoanId) return;

    void getLoan(id)
      .then((response) => {
        if (cancelled) return;
        setLoanNumber(response.loan.loanNumber);
        setForbidden(false);
      })
      .catch((failure: unknown) => {
        if (cancelled) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else if (failure instanceof ApiError && failure.status === 404) setNotFound(true);
        else setError(message(failure, "Could not load transactions."));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, isValidLoanId]);

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader breadcrumb="Accounts" title="Loan transactions" description="Transaction ledger for this loan." />
        <ForbiddenPanel message="Your role cannot view loans. Ask an administrator for Loan Account : View." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loan transactions" description="Transaction ledger for this loan." />
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={6} />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loan transactions" description="Transaction ledger for this loan." />
        <ErrorPanel message={error} />
      </div>
    );
  }

  if (notFound || !isValidLoanId) {
    return (
      <div className="space-y-5">
        <PageHeader breadcrumb="Accounts" title="Loan transactions" description="Transaction ledger for this loan." />
        <EmptyState
          icon={Receipt}
          title="Loan record unavailable"
          description="Select a loan from the Loans list to view its transaction ledger. The reference sample ID is not a local loan identifier."
          action={(
            <Button asChild variant="outline">
              <Link href="/account-loan">Back to loans</Link>
            </Button>
          )}
        />
      </div>
    );
  }

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
      <PageHeader title={`Transactions · ${loanNumber}`} description="Transaction ledger for this loan." />
      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left fs-text">
            <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={6}>
                  No transactions recorded for this loan.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
