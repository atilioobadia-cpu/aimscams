"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getLoanProduct, type LoanProduct } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="fs-text font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 fs-text text-strong">{value}</dd>
    </div>
  );
}

export function LoanProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<LoanProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    void getLoanProduct(id)
      .then((response) => {
        if (!active) return;
        setProduct(response.product);
      })
      .catch((failure: unknown) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setForbidden(true);
        } else if (failure instanceof ApiError && failure.status === 404) {
          setNotFound(true);
        } else {
          setError(message(failure, "Could not load this loan product."));
        }
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loan product" description="Loan product terms." />
        <ForbiddenPanel message="Your role cannot view loan products. Ask an administrator for Settings Product : View." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loan product" description="Loan product terms." />
        <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-24)] text-center">
          <p className="fs-text font-bold text-strong">Loan product not found</p>
          <p className="mt-1 fs-text text-muted-foreground">It may have been removed or the link is stale.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/settings/products/loan">Back to loan products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/products/loan">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Loan products
          </Link>
        </Button>
      </div>

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={10} />
        </section>
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => window.location.reload()} />
      ) : product ? (
        <>
          <PageHeader
            title={`${product.code} — ${product.name}`}
            description={product.description ?? "Loan product terms snapshotted onto accounts."}
          />

          <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-16)]">
            <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-14)] md:grid-cols-2 lg:grid-cols-3">
              <Field label="Status" value={titleCase(product.status)} />
              <Field label="Interest method" value={product.interestMethod} />
              <Field label="Repayment frequency" value={product.repaymentFrequency} />
              <Field label="Interest rate" value={`${(product.interestRateBp / 100).toFixed(2)}%`} />
              <Field label="Principal range" value={`${product.minPrincipalMinor} – ${product.maxPrincipalMinor}`} />
              <Field label="Tenure (months)" value={`${product.minTenureMonths} – ${product.maxTenureMonths}`} />
              <Field label="Grace period (days)" value={String(product.gracePeriodDays)} />
              <Field label="Arrears classification (days)" value={String(product.arrearsClassificationDays)} />
              <Field label="Management fee" value={`${(product.managementFeeBp / 100).toFixed(2)}%`} />
              <Field label="Penalty" value={`${(product.penaltyBp / 100).toFixed(2)}%`} />
              <Field label="Principal account" value={product.principalAccountId ?? "N/A"} />
              <Field label="Interest income account" value={product.interestIncomeAccountId ?? "N/A"} />
              <Field label="Charges income account" value={product.chargesIncomeAccountId ?? "N/A"} />
              <Field label="Penalty income account" value={product.penaltyIncomeAccountId ?? "N/A"} />
            </dl>
          </section>

          {product.workflowStages ? (
            <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-16)]">
              <h2 className="fs-text font-bold text-strong">Workflow stages</h2>
              <pre className="mt-3 overflow-auto rounded-[var(--card-radius)] bg-subtle p-[var(--space-12)] fs-text text-body">
                {JSON.stringify(product.workflowStages, null, 2)}
              </pre>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
