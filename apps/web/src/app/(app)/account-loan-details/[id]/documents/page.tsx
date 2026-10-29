"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { loanApplicationDocumentUrl } from "@/lib/settings";
import { getLoan, getLoanApplication, type LoanApplicationDocument } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function LoanDocumentsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loanNumber, setLoanNumber] = useState<string>("");
  const [documents, setDocuments] = useState<LoanApplicationDocument[]>([]);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getLoan(id)
      .then(async (response) => {
        if (cancelled) return;
        setLoanNumber(response.loan.loanNumber);
        const appId = response.loan.applicationId;
        setApplicationId(appId ?? null);
        if (appId) {
          try {
            const appResponse = await getLoanApplication(appId);
            if (!cancelled) setDocuments(appResponse.application.documents);
          } catch {
            if (!cancelled) setDocuments([]);
          }
        }
        setForbidden(false);
      })
      .catch((failure: unknown) => {
        if (cancelled) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else setError(message(failure, "Could not load documents."));
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
        <PageHeader breadcrumb="Accounts" title="Loan documents" description="Documents attached to this loan." />
        <ForbiddenPanel message="Your role cannot view loans. Ask an administrator for Loan Account : View." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loan documents" description="Documents attached to this loan." />
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={6} />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loan documents" description="Documents attached to this loan." />
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
      <PageHeader title={`Documents · ${loanNumber}`} description="Documents attached to this loan." />
      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        {documents.length === 0 ? (
          <EmptyState icon={FileText} title="No documents" description="No documents are attached to this loan." />
        ) : (
          <ul className="divide-y divide-card-border">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate fs-text font-medium text-body">{document.name}</p>
                  <p className="fs-text text-muted-foreground">
                    {titleCase(document.kind)} · {Math.round(document.sizeBytes / 1024)} KB
                  </p>
                </div>
                {applicationId ? (
                  <a
                    href={loanApplicationDocumentUrl(applicationId, document.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 fs-text font-medium text-primary"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Download
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}