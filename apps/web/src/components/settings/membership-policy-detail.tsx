"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ListChecks, Shield, Users } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getMembershipPolicy, type MembershipPolicy } from "@/lib/settings";
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

export function MembershipPolicyDetail({ id }: { id: string }) {
  const [policy, setPolicy] = useState<MembershipPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    void getMembershipPolicy(id)
      .then((response) => {
        if (!active) return;
        setPolicy(response.item);
      })
      .catch((failure: unknown) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else if (failure instanceof ApiError && failure.status === 404) setNotFound(true);
        else setError(message(failure, "Could not load this membership policy."));
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
        <PageHeader breadcrumb="Settings" title="Membership policy" description="Membership policy definitions." />
        <ForbiddenPanel message="Your role cannot view membership policies. Ask an administrator for Settings Policy : View." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-5">
        <PageHeader title="Membership policy" description="Membership policy definitions." />
        <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-24)] text-center">
          <p className="fs-text font-bold text-strong">Membership policy not found</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/settings/policies/membership">Back to membership policies</Link>
          </Button>
        </div>
      </div>
    );
  }

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
            <h1 className="col-span-2 flex items-center gap-3 fs-title font-semibold text-heading 2xl:col-span-1"><Shield className="size-5 shrink-0 text-primary" aria-hidden="true" />Membership Policy Details</h1>
            <div><p className="fs-caption font-semibold text-muted-foreground">Status</p><p className="mt-1 fs-text text-strong">{titleCase(policy.status)}</p></div>
            <div><p className="fs-caption font-semibold text-muted-foreground">Name</p><p className="mt-1 fs-text text-strong">{policy.name}</p></div>
            <div><p className="fs-caption font-semibold text-muted-foreground">Description</p><p className="mt-1 fs-text text-strong">{policy.description || "N/A"}</p></div>
            <div><p className="fs-caption font-semibold text-muted-foreground">Member Type</p><p className="mt-1 fs-text text-strong">{titleCase(policy.memberType)}</p></div>
            <div className="col-span-2 flex items-center justify-end gap-2 2xl:col-span-1 2xl:justify-self-end">
              <Button asChild variant="outline" size="sm"><Link href="/settings/policies/membership"><ArrowLeft className="size-4" aria-hidden="true" />Back</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href={`/settings/policies/membership/${policy.id}/edit`}>Edit</Link></Button>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 fs-section font-semibold text-heading"><Users className="size-4 text-primary" aria-hidden="true" />Next of Kin &amp; Member Dormancy</h2>
            <div className="rounded-[var(--card-radius)] border border-card-border bg-card p-5">
              <dl className="grid gap-x-10 gap-y-4 md:grid-cols-2">
                <Field label="Minimum Next of Kin" value={String(policy.minNextOfKin)} />
                <Field label="Maximum Next of Kin" value={String(policy.maxNextOfKin)} />
                <Field label="Dormant Days" value={String(policy.dormantDays)} />
                <Field label="Allow Withdraw" value={policy.allowWithdraw ? "Yes" : "No"} />
                <Field label="Auto Active Upon Deposit" value={policy.autoActiveUponDeposit ? "Yes" : "No"} />
              </dl>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 fs-section font-semibold text-heading"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" />Member Activation</h2>
            <div className="rounded-[var(--card-radius)] border border-card-border bg-card p-5">
              <dl className="grid gap-x-10 gap-y-4 md:grid-cols-2">
                <Field label="Enable Member Verification Required" value={policy.enableMemberVerification ? "Yes" : "No"} />
                <Field label="Verification Type" value={policy.verificationType ? titleCase(policy.verificationType) : "N/A"} />
              </dl>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 fs-section font-semibold text-heading"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" />Approval Status</h2>
            <div className="rounded-[var(--card-radius)] border border-card-border bg-card px-6 py-5"><p className="fs-text text-muted-foreground">Approval history is not available for this membership policy model.</p></div>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 fs-section font-semibold text-heading"><Users className="size-4 text-primary" aria-hidden="true" />Select Board Member</h2>
            <div className="max-w-[32rem] rounded-[var(--card-radius)] border border-card-border bg-card p-5">
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="membership-board-member">Board Member</label>
              <select id="membership-board-member" disabled className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-subtle px-3 fs-text text-muted-foreground"><option>Not available in this policy model</option></select>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 fs-section font-semibold text-heading"><ListChecks className="size-4 text-primary" aria-hidden="true" />Membership Policy Approval List</h2>
            <div className="overflow-x-auto rounded-[var(--card-radius)] border border-card-border bg-card">
              <table className="w-full min-w-[720px] border-collapse fs-text">
                <thead><tr className="bg-subtle text-left text-muted-foreground"><th className="px-4 py-3 font-semibold">Assigned To</th><th className="px-4 py-3 font-semibold">Policy Approval Status</th><th className="px-4 py-3 font-semibold">Comment</th><th className="px-4 py-3 font-semibold">Action Date</th><th className="px-4 py-3 font-semibold">Actions</th></tr></thead>
                <tbody><tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Approval assignments are not available for this policy model.</td></tr></tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
