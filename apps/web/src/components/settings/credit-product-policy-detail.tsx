"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getCreditProductPolicy, type CreditProductPolicy } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
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
        <PageHeader title="Credit product policy" description="Credit product policy definitions." />
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

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/policies/credit-product">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Credit product policies
          </Link>
        </Button>
        {policy ? (
          <Button asChild size="sm">
            <Link href={`/settings/policies/credit-product/${policy.id}/edit`}>Edit</Link>
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
          <PageHeader title={`${policy.code} — ${policy.name}`} description={policy.description ?? "Credit product policy definitions."} />
          <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-16)]">
            <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-14)] md:grid-cols-2">
              <div>
                <dt className="fs-text font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1 fs-text text-strong">{policy.status}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">Content</dt>
                <dd className="mt-1">
                  <pre className="overflow-auto rounded-[var(--card-radius)] bg-subtle p-[var(--space-12)] fs-text text-body">
                    {JSON.stringify(policy.content, null, 2)}
                  </pre>
                </dd>
              </div>
            </dl>
          </section>
        </>
      ) : null}
    </div>
  );
}
