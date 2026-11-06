"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, Calendar, FileText, GitBranch, Percent, Shield, Settings as SettingsIcon, List, BookOpen } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { formatMinorUnitsExact } from "@/lib/format";
import { getLoanProduct, listFeePenalties, type LoanProduct, type FeePenalty } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";
import { cn } from "cn";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function humanize(value: string | null | undefined): string {
  if (!value) return "N.A.";
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function Field({ label, value, pill }: { label: string; value: string; pill?: "yes" | "no" | "na" | "none" }) {
  return (
    <div>
      <dt className="fs-text font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        {pill && pill !== "none" ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-[8.4px] py-[1.68px] fs-text font-medium",
              pill === "yes" && "bg-[#e1eeee] text-[#057573]",
              pill === "no" && "bg-[#fde8e8] text-[#c0392b]",
              pill === "na" && "bg-[#f1f3f5] text-[#495057] font-semibold",
            )}
          >
            {value}
          </span>
        ) : (
          <span className="fs-text text-strong">{value}</span>
        )}
      </dd>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-16)]">
      <div className="mb-[var(--space-12)] flex items-center gap-[8.4px]">
        <Icon className="size-[16px] text-primary" aria-hidden="true" />
        <h2 className="fs-text font-bold text-strong">{title}</h2>
      </div>
      <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-14)] md:grid-cols-2 lg:grid-cols-3">
        {children}
      </dl>
    </section>
  );
}

function Table({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left fs-text">
        <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-3 py-2.5">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-card-border last:border-0" style={{ height: "44px" }}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="whitespace-nowrap px-3 py-2.5 text-body">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoanProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<LoanProduct | null>(null);
  const [fees, setFees] = useState<FeePenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"Summary" | "History">("Summary");

  useEffect(() => {
    let active = true;

    void listFeePenalties()
      .then((response) => {
        if (!active) return;
        setFees(response.items);
      })
      .catch(() => {
        if (!active) return;
        setFees([]);
      });

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

  const gracePeriod = product?.gracePeriodDays ? `${product.gracePeriodDays} days` : "N.A.";

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
          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[20.16px] shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-[13.44px]">
              <div className="flex items-center gap-[13.44px]">
                <span className="flex size-[40px] items-center justify-center rounded-[8px] border border-primary bg-primary-tint text-primary">
                  <Briefcase className="size-[20px]" aria-hidden="true" />
                </span>
                <h1 className="text-[20.16px] font-bold uppercase tracking-wide text-heading">{product.name}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-[26.88px]">
                <div>
                  <p className="fs-text font-semibold text-strong">Status</p>
                  <span className="mt-1 inline-flex items-center rounded-full bg-[#e1eeee] px-[8.4px] py-[1.68px] fs-text font-medium text-[#057573]">
                    {titleCase(product.status)}
                  </span>
                </div>
                <div>
                  <p className="fs-text font-semibold text-strong">Loan Type</p>
                  <p className="mt-1 fs-text text-body">N.A.</p>
                </div>
                <div>
                  <p className="fs-text font-semibold text-strong">Last Updated</p>
                  <p className="mt-1 fs-text text-body">N.A.</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings/products/loan">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Link>
              </Button>
            </div>
          </section>

          <div className="flex gap-[6.72px] border-b border-card-border bg-subtle px-[6.72px]">
            {(["Summary", "History"] as const).map((label) => (
              <button
                key={label}
                type="button"
                className={cn(
                  "px-[13.44px] py-[8.4px] fs-text font-semibold transition-colors",
                  tab === label ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-strong",
                )}
                onClick={() => setTab(label)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "Summary" ? (
            <div className="space-y-[13.44px]">
              <Section title="Terms" icon={FileText}>
                <Field label="Minimum Loan Amount" value={formatMinorUnitsExact(product.minPrincipalMinor)} />
                <Field label="Maximum Loan Amount" value={formatMinorUnitsExact(product.maxPrincipalMinor)} />
                <Field label="Tenure Period" value={`${product.minTenureCount} - ${product.maxTenureCount} ${titleCase(product.tenurePeriod.toLowerCase())}`} />
                <Field label="Grace Period" value={gracePeriod} />
                <Field label="Interest On Grace Period" value="No" pill="no" />
                <Field label="Multiplier On Savings" value="1" />
                <Field label="Multiplier On Shares" value="1" />
              </Section>

              <Section title="Settings" icon={SettingsIcon}>
                <Field label="Before Due Date Notification Days" value="0" />
                <Field label="Number of Grace Period Before Moving Into Arrear" value="0" />
                <Field label="Over Due Date Notification Days" value="0" />
                <Field label="Number Of Days Before Becoming NPA" value="0" />
                <Field label="After Default Notification Days" value="0" />
                <Field label="Loan Provisioning" value="N.A." pill="na" />
                <Field label="Enable Multiple Disbursements (Loan Tranche)" value="No" pill="no" />
                <Field label="Enable Multiple Loans" value="N.A." pill="na" />
                <Field label="Quick Loan" value="No" pill="no" />
                <Field label="Exclude holidays on arrears" value="No" pill="no" />
              </Section>

              <Section title="Interest" icon={Percent}>
                <Field label="Interest Rate" value={`${(product.interestRateBp / 100).toFixed(1)}% per Month - Fixed`} />
                <Field label="Interest Rate Calculation Method" value={humanize(product.interestMethod)} />
                <Field label="Fixed Yearly Interest" value="No" pill="no" />
                <div className="md:col-span-2 lg:col-span-3">
                  <h3 className="mb-[var(--space-8)] fs-text font-bold text-strong">Income</h3>
                  <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-14)] md:grid-cols-2 lg:grid-cols-3">
                    <Field label="Configure Type" value="Accrual" />
                    <Field label="Accrual Interest Calculation Term" value="On Due Date" />
                    <Field label="Accrue interest after maturity" value="N.A." pill="na" />
                    <Field label="% cap on principal Borrowed is required" value="N.A." />
                  </dl>
                </div>
              </Section>

              <Section title="Repayments" icon={Calendar}>
                <Field label="Repayment Strategy" value="Charges, Interest and Principal" />
                <Field label="Advance Payment Strategy" value="N.A." />
                <Field label="Advance Payments Adjustment" value="Adjust Next Installment" />
                <Field label="Pre-closure Interest Calculation" value="N.A." />
                <Field label="Recalculate Interest On Repayment" value="N.A." pill="na" />
                <Field label="Recalculate Interest On Accrual" value="N.A." pill="na" />
                <Field label="Interest Compounding On" value="N.A." />
              </Section>

              <Section title="Guarantors and Collateral" icon={Shield}>
                <Field label="Guarantors" value="Others" />
                <Field label="Minimum Number Of Guarantors" value="2" />
                <Field label="Collateral Type" value="Others" />
                <Field label="Collateral Ratio" value="150" />
              </Section>

              <Section title="Loan Product Charges" icon={List}>
                <div className="md:col-span-2 lg:col-span-3">
                  <Table
                    columns={["Payment Mode", "Payment Upon Loan Repayment", "Charge Name", "Charge Fee Type", "Component", "Value"]}
                    rows={fees.map((fee) => [
                      fee.name === "LOAN MANAGEMENT FEE"
                        ? "Payment Upon Processing And Disbursement"
                        : "Payment Upon Delayed Repayment",
                      "N.A.",
                      fee.name,
                      humanize(fee.amountType),
                      fee.name === "LOAN MANAGEMENT FEE" ? "Loan Amount" : "Current Due Principal And Interest",
                      fee.amountType === "PERCENTAGE" && fee.rateBp !== null
                        ? `${(fee.rateBp / 100).toFixed(1).replace(/\\.0$/, "")}%`
                        : fee.amountMinor ?? "N.A.",
                    ])}
                  />
                </div>
              </Section>

              <Section title="Loan Product Stages" icon={GitBranch}>
                <div className="md:col-span-2 lg:col-span-3">
                  <Table
                    columns={["Loan Stage", "Default Role", "Default Assignee", "Description"]}
                    rows={[
                      ["KYC & Documentation", "Loan Officer", "N.A.", "N.A."],
                      ["Guarantor & Collateral", "Credit Officer", "N.A.", "N.A."],
                      ["Eligibility & Credit Verification", "Accountant", "N.A.", "N.A."],
                      ["Sanctions & Approval", "Managing Director", "N.A.", "N.A."],
                    ]}
                  />
                </div>
              </Section>

              <Section title="Accounting Settings" icon={BookOpen}>
                <div className="md:col-span-2 lg:col-span-3">
                  <Table
                    columns={["Account Type", "Account", "Type"]}
                    rows={[
                      ["Loan Portfolio Account", product.principalAccountLabel ?? "N.A.", "Assets"],
                      ["Accrued Account", product.accruedAccountLabel ?? "N.A.", "Assets"],
                      ["Income From Interest", product.interestIncomeAccountLabel ?? "N.A.", "Income"],
                      ["Expenses Losses Written Off", product.expenseAccountLabel ?? "N.A.", "Expense"],
                      ["Overpayment Account", product.overpaymentAccountLabel ?? "N.A.", "Liabilities"],
                      ["Loan Suspense Account", product.suspenseAccountLabel ?? "N.A.", "Assets"],
                    ]}
                  />
                </div>
              </Section>
            </div>
          ) : (
            <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-24)] text-center">
              <p className="fs-text text-muted-foreground">No history available.</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}