"use client";

import { useEffect, useState } from "react";
import { Upload } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { titleCase } from "@/lib/privacy";
import { listImportBatches, type ImportBatch, type ImportBatchList } from "@/lib/settings";

function failureMessage(failure: unknown): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return "Could not load import batches.";
}

export function MemberImportBatchesPage() {
  const [data, setData] = useState<ImportBatchList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void listImportBatches("MEMBER")
        .then((next) => {
          if (cancelled) return;
          setData(next);
          setForbidden(false);
        })
        .catch((failure: unknown) => {
          if (cancelled) return;
          if (failure instanceof ApiError && failure.status === 403) {
            setForbidden(true);
            setData(null);
          } else {
            setError(failureMessage(failure));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reloadKey]);

  const items = data?.items ?? [];

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader title="Member import batches" description="Track member import batches." />
        <ForbiddenPanel message="Your role cannot view import batches. Ask an administrator for Import : View." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Member import batches" description="Track member import batches and their results." breadcrumb="Import" />

      {error ? <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="fs-text text-muted-foreground">{items.length} batches</p>
        <Button asChild>
          <a href="/import-member-new">New import</a>
        </Button>
      </div>

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={6} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState icon={Upload} title="No import batches yet" description="Start a new member import to track progress here." />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Id</th>
                  <th className="whitespace-nowrap px-4 py-3">Reference</th>
                  <th className="whitespace-nowrap px-4 py-3">File</th>
                  <th className="whitespace-nowrap px-4 py-3">Type</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Total</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Uploaded</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Failed</th>
                  <th className="whitespace-nowrap px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: ImportBatch) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.id.slice(0, 8)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{item.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.fileName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{item.kind}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={item.status === "COMPLETED" ? "default" : "outline"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{item.totalRows}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{item.successRows}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-body text-right">{item.failedRows}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
