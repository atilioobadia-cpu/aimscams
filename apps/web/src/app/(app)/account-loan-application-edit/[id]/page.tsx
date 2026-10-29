"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { getLoanApplication } from "@/lib/settings";
import { LoanApplicationWizard } from "@/components/accounts/loan-application-wizard";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function EditLoanApplicationPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [application, setApplication] = useState<Awaited<ReturnType<typeof getLoanApplication>>["application"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getLoanApplication(id)
      .then((response) => {
        if (cancelled) return;
        setApplication(response.application);
        setForbidden(false);
      })
      .catch((failure: unknown) => {
        if (cancelled) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setForbidden(true);
        } else {
          setError(message(failure, "Could not load this loan application."));
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader breadcrumb="Accounts" title="Edit loan application" description="Edit an application before its first approval." />
        <ForbiddenPanel message="Your role cannot edit loan applications. Ask an administrator for Loan Account : Edit." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Edit loan application" description="Edit an application before its first approval." />
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={6} />
        </section>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-5">
        <PageHeader title="Edit loan application" description="Edit an application before its first approval." />
        <ErrorPanel message={error ?? "Could not load this loan application."} />
      </div>
    );
  }

  if (application.status !== "DRAFT" && application.status !== "SUBMITTED") {
    return (
      <div className="space-y-5">
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/account-loan-application-details/${application.id}`}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to application
            </Link>
          </Button>
        </div>
        <PageHeader title="Edit loan application" description="Edit an application before its first approval." />
        <p className="fs-text text-body">
          This application can no longer be edited because it has been {application.status.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/account-loan-application-details/${application.id}`}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to application
          </Link>
        </Button>
      </div>
      <LoanApplicationWizard initial={application} applicationId={application.id} />
    </div>
  );
}
