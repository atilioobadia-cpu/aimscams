"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";

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

export default function LoanGuarantorsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loanNumber, setLoanNumber] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getLoan(id)
      .then((response) => {
        if (cancelled) return;
        setLoanNumber(response.loan.loanNumber);
        setForbidden(false);
      })
      .catch((failure: unknown) => {
        if (cancelled) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else setError(message(failure, "Could not load guarantors."));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader breadcrumb="Accounts" title="Guarantors and collateral" description="Guarantors and collateral for this loan." />
        <ForbiddenPanel message="Your role cannot view loans. Ask an administrator for Loan Account : View." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Guarantors and collateral" description="Guarantors and collateral for this loan." />
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={6} />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="Guarantors and collateral" description="Guarantors and collateral for this loan." />
        <ErrorPanel message={error} />
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
      <PageHeader title={`Guarantors · ${loanNumber}`} description="Guarantors and collateral for this loan." />
      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left fs-text">
            <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Relationship</th>
                <th className="px-4 py-3 text-right">Share</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                  No guarantors recorded.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}