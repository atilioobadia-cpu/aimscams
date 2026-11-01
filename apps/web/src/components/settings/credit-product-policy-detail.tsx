"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, ListChecks, Pencil } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api";
import { getCreditProductPolicy, type CreditProductPolicy } from "@/lib/settings";

const TABS = [
  { key: "terms", label: "Terms" },
  { key: "settings", label: "Settings" },
  { key: "interest", label: "Interest" },
  { key: "repayments", label: "Repayments" },
  { key: "guarantorsAndCollateral", label: "Guarantors and collateral" },
  { key: "loanCharges", label: "Loan charges" },
  { key: "loanStages", label: "Loan stages" },
  { key: "accountingSetting", label: "Accounting setting" },
] as const;

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground">Not set</span>;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">None</span>;
    return (
      <ul className="list-disc space-y-1 pl-5">
        {value.map((item, index) => (
          <li key={index}>{renderValue(item)}</li>
        ))}
      </ul>
    );
  }
  const record = asRecord(value);
  if (record) {
    const entries = Object.entries(record);
    if (entries.length === 0) return <span className="text-muted-foreground">Not configured</span>;
    return (
      <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-12)] md:grid-cols-2">
        {entries.map(([key, val]) => (
          <div key={key}>
            <dt className="fs-text font-medium text-muted-foreground">{key}</dt>
            <dd className="mt-1 fs-text text-strong">{renderValue(val)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return <pre className="overflow-auto rounded-[var(--card-radius)] bg-subtle p-[var(--space-12)] fs-text text-body">{JSON.stringify(value, null, 2)}</pre>;
}

export function CreditProductPolicyDetail({ id }: { id: string }) {
  const [policy, setPolicy] = useState<CreditProductPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    void getCreditProductPolicy(id)
      .then((response) => {
        if (!active) return;
        setPolicy(response.item);
      })
      .catch((failure: unknown) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else if (failure instanceof ApiError && failure.status === 404) setNotFound(true);
        else setError(message(failure, "Could not load this credit product policy."));
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
        <PageHeader breadcrumb="Settings" title="Credit product policy" description="Credit product policy definitions." />
        <ForbiddenPanel message="Your role cannot view credit product policies. Ask an administrator for Settings Policy : View." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-5">
        <PageHeader title="Credit product policy" description="Credit product policy definitions." />
        <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-24)] text-center">
          <p className="fs-text font-bold text-strong">Credit product policy not found</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/settings/policies/credit-product">Back to credit product policies</Link>
          </Button>
        </div>
      </div>
    );
  }

  const content = asRecord(policy?.content);

  return (
    <div className="space-y-5">
      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => window.location.reload()} />
      ) : policy ? (
        <>
          <section className="grid grid-cols-2 items-center gap-x-6 gap-y-4 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-5 2xl:grid-cols-[minmax(230px,1.6fr)_repeat(4,minmax(110px,1fr))_auto]">
            <h1 className="col-span-2 flex items-center gap-3 fs-title font-semibold text-heading 2xl:col-span-1"><CreditCard className="size-5 shrink-0" aria-hidden="true" />Credit Product Policy Details</h1>
            <div><p className="fs-caption font-semibold text-muted-foreground">Product</p><p className="mt-1 fs-text text-strong">{policy.name}</p></div>
            <div><p className="fs-caption font-semibold text-muted-foreground">Description</p><p className="mt-1 fs-text text-strong">{policy.description || "N/A"}</p></div>
            <div><p className="fs-caption font-semibold text-muted-foreground">Loan Type</p><p className="mt-1 fs-text text-strong">{typeof content?.loanType === "string" ? content.loanType : "N/A"}</p></div>
            <div><p className="fs-caption font-semibold text-muted-foreground">Status</p><p className="mt-1 fs-text text-strong">{policy.status}</p></div>
            <div className="col-span-2 flex items-center justify-end gap-2 2xl:col-span-1 2xl:justify-self-end">
              <Button asChild variant="outline" size="sm"><Link href="/settings/policies/credit-product"><ArrowLeft className="size-4" aria-hidden="true" />Back</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href={`/settings/policies/credit-product/${policy.id}/edit`}><Pencil className="size-4" aria-hidden="true" />Edit</Link></Button>
            </div>
          </section>

          <Tabs defaultValue="accountingSetting" className="space-y-4">
            <TabsList className="w-full overflow-x-auto rounded-[var(--card-radius)] border border-card-border bg-card px-3">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((tab) => {
              const section = content ? content[tab.key] ?? content[tab.label] ?? content[tab.label.toLowerCase()] : null;
              return (
                <TabsContent key={tab.key} value={tab.key}>
                  <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-16)]">
                    {section === null || section === undefined ? (
                      <p className="fs-text text-muted-foreground">No {tab.label.toLowerCase()} configured for this policy.</p>
                    ) : (
                      renderValue(section)
                    )}
                  </section>
                </TabsContent>
              );
            })}
          </Tabs>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 fs-section font-semibold text-heading"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" />Approval Status</h2>
            <div className="rounded-[var(--card-radius)] border border-card-border bg-card px-6 py-5">
              <p className="fs-text text-muted-foreground">Approval history is not available for this policy model.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 fs-section font-semibold text-heading"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" />Stage Approval</h2>
            <div className="rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-5">
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-stage-approver">Board Member</label>
              <select id="cpp-stage-approver" disabled className="h-[var(--control-height)] w-full max-w-[24rem] rounded-[var(--control-radius)] border border-input bg-subtle px-3 fs-text text-muted-foreground"><option>Not available in this policy model</option></select>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 fs-section font-semibold text-heading"><ListChecks className="size-4 text-primary" aria-hidden="true" />Credit Product Policy Approval List</h2>
            <div className="overflow-x-auto rounded-[var(--card-radius)] border border-card-border bg-card">
              <table className="w-full min-w-[720px] border-collapse fs-text">
                <thead><tr className="bg-subtle text-left text-muted-foreground"><th className="px-4 py-3 font-semibold">Assigned To User</th><th className="px-4 py-3 font-semibold">Policy Approval Status</th><th className="px-4 py-3 font-semibold">Comment</th><th className="px-4 py-3 font-semibold">Action Date</th><th className="px-4 py-3 font-semibold">Actions</th></tr></thead>
                <tbody><tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Approval assignments are not available for this policy model.</td></tr></tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
