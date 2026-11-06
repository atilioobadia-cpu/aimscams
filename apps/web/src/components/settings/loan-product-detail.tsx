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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-16)]">
      <h2 className="mb-[var(--space-12)] fs-text font-bold text-strong">{title}</h2>
      <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-14)] md:grid-cols-2 lg:grid-cols-3">
        {children}
      </dl>
    </section>
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
        <PageHeader breadcrumb="Settings" title="Loan product" description="Loan product terms." />
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

          <Section title="Status">
            <Field label="Status" value={titleCase(product.status)} />
            <Field label="Loan Type" value="N/A" />
            <Field label="Last Updated" value="N/A" />
          </Section>

          <Section title="Terms">
            <Field label="Minimum Loan Amount" value={product.minPrincipalMinor} />
            <Field label="Maximum Loan Amount" value={product.maxPrincipalMinor} />
            <Field label="Tenure Period" value={`${product.minTenureCount} – ${product.maxTenureCount} ${product.tenurePeriod}`} />
            <Field label="Grace Period" value={`${product.gracePeriodDays} days`} />
            <Field label="Multiplier On Savings" value="1" />
            <Field label="Multiplier On Shares" value="1" />
          </Section>

          <Section title="Settings">
            <Field label="Before Due Date Notification Days" value="0" />
            <Field label="Number of Grace Period Before Moving Into Arrear" value="0" />
            <Field label="Over Due Date Notification Days" value="0" />
            <Field label="Number Of Days Before Becoming NPA" value="0" />
            <Field label="After Default Notification Days" value="0" />
            <Field label="Loan Provisioning" value="N/A" />
            <Field label="Enable Multiple Disbursements (Loan Tranche)" value="No" />
            <Field label="Enable Multiple Loans" value="N/A" />
            <Field label="Quick Loan" value="No" />
            <Field label="Exclude holidays on arrears" value="No" />
          </Section>

          <Section title="Interest">
            <Field label="Interest Rate" value={`${(product.interestRateBp / 100).toFixed(2)}% per Month - Fixed`} />
            <Field label="Interest Rate Calculation Method" value={product.interestMethod} />
            <Field label="Fixed Yearly Interest" value="No" />
          </Section>

          <Section title="Income">
            <Field label="Configure Type" value="Accrual" />
            <Field label="Accrual Interest Calculation Term" value="On Due Date" />
            <Field label="Accrue interest after maturity" value="N/A" />
            <Field label="% cap on principal Borrowed is required" value="N/A" />
          </Section>

          <Section title="Repayments">
            <Field label="Repayment Strategy" value="Charges, Interest and Principal" />
            <Field label="Advance Payment Strategy" value="N/A" />
            <Field label="Advance Payments Adjustment" value="Adjust Next Installment" />
            <Field label="Pre-closure Interest Calculation" value="N/A" />
            <Field label="Recalculate Interest On Repayment" value="N/A" />
            <Field label="Recalculate Interest On Accrual" value="N.A." />
            <Field label="Interest Compounding On" value="N.A." />
          </Section>

          <Section title="Guarantors and Collateral">
            <Field label="Guarantors" value="Others" />
            <Field label="Minimum Number Of Guarantors" value="2" />
            <Field label="Collateral Type" value="Others" />
            <Field label="Collateral Ratio" value="150" />
          </Section>

          <Section title="Loan Product Charges">
            <Field label="Payment Upon Processing And Disbursement" value="N/A" />
            <Field label="Payment Upon Delayed Repayment" value="N/A" />
          </Section>

          <Section title="Loan Product Stages">
            <Field label="KYC & Documentation" value="Loan Officer" />
            <Field label="Guarantor & Collateral" value="Credit Officer" />
            <Field label="Eligibility & Credit Verification" value="Accountant" />
            <Field label="Sanctions & Approval" value="Managing Director" />
          </Section>

          <Section title="Accounting Settings">
            <Field label="Loan Portfolio Account" value={product.principalAccountId ?? "N/A"} />
            <Field label="Accrued Account" value={product.interestIncomeAccountId ?? "N/A"} />
            <Field label="Income From Interest" value={product.interestIncomeAccountId ?? "N/A"} />
            <Field label="Expenses Losses Written Off" value={product.chargesIncomeAccountId ?? "N/A"} />
            <Field label="Overpayment Account" value={product.penaltyIncomeAccountId ?? "N/A"} />
            <Field label="Loan Suspense Account" value="N/A" />
          </Section>

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