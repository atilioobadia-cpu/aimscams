"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/policies/membership">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Membership policies
          </Link>
        </Button>
        {policy ? (
          <Button asChild size="sm">
            <Link href={`/settings/policies/membership/${policy.id}/edit`}>Edit</Link>
          </Button>
        ) : null}
      </div>

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => window.location.reload()} />
      ) : policy ? (
        <>
          <PageHeader title={`${policy.code} — ${policy.name}`} description={policy.description ?? "Membership policy definitions."} />
          <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-16)]">
            <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-14)] md:grid-cols-2 lg:grid-cols-3">
              <Field label="Status" value={titleCase(policy.status)} />
              <Field label="Member type" value={policy.memberType} />
              <Field label="Minimum next of kin" value={String(policy.minNextOfKin)} />
              <Field label="Maximum next of kin" value={String(policy.maxNextOfKin)} />
              <Field label="Dormant days" value={String(policy.dormantDays)} />
              <Field label="Allow withdraw" value={policy.allowWithdraw ? "Yes" : "No"} />
              <Field label="Auto active upon deposit" value={policy.autoActiveUponDeposit ? "Yes" : "No"} />
              <Field label="Enable member verification" value={policy.enableMemberVerification ? "Yes" : "No"} />
              <Field label="Verification type" value={policy.verificationType ?? "N/A"} />
            </dl>
          </section>
        </>
      ) : null}
    </div>
  );
}
