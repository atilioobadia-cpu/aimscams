"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Download, FileText } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, FormError } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import { formatTzs } from "@/lib/format";
import {
  getLoanApplication,
  loanApplicationDocumentUrl,
  listEconomicSectors,
  updateLoanApplicationStatus,
  type EconomicSector,
  type LoanApplication,
  type LoanApplicationStatus,
} from "@/lib/settings";
import { maskNationalId, maskPhone, titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

const DESTINATION_LABELS = {
  BANK: "Bank account",
  MNO: "Mobile money",
  CASH: "Cash at branch",
} as const;

function sectorName(code: string | null, sectors: EconomicSector[]): string {
  if (!code) return "N/A";
  for (const sector of sectors) {
    if (sector.code === code) return sector.name;
    for (const sub of sector.children) {
      if (sub.code === code) return `${sector.name} / ${sub.name}`;
      for (const leaf of sub.children) {
        if (leaf.code === code) return `${sector.name} / ${sub.name} / ${leaf.name}`;
      }
    }
  }
  return code;
}

function tenureLabel(application: LoanApplication): string {
  return `${application.tenureCount} ${application.tenurePeriod.toLowerCase()}`;
}

type DetailState = {
  application: LoanApplication;
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canCancel: boolean;
};

export default function LoanApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  const [state, setState] = useState<DetailState | null>(null);
  const [sectors, setSectors] = useState<EconomicSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void Promise.all([getLoanApplication(id), listEconomicSectors()])
      .then(([response, sectorResponse]) => {
        if (cancelled) return;
        setState({
          application: response.application,
          canEdit: response.canEdit,
          canApprove: Boolean(response.canApprove),
          canReject: Boolean(response.canReject),
          canCancel: Boolean(response.canCancel),
        });
        setSectors(sectorResponse.items);
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

  async function transition(status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED") {
    if (!state) return;
    setActionError(null);
    setActing(status);
    try {
      const response = await updateLoanApplicationStatus(state.application.id, status);
      setState((current) =>
        current
          ? {
              ...current,
              application: response.application,
              canEdit: response.canEdit,
              canApprove: Boolean(response.canApprove),
              canReject: Boolean(response.canReject),
              canCancel: Boolean(response.canCancel),
            }
          : current,
      );
    } catch (failure: unknown) {
      setActionError(message(failure, "Could not update this application."));
    } finally {
      setActing(null);
    }
  }

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader breadcrumb="Accounts" title="Loan application" description="Application details." />
        <ForbiddenPanel message="Your role cannot view loan applications. Ask an administrator for Loan Account : View." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loan application" description="Application details." />
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={10} />
        </section>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="space-y-5">
        <PageHeader title="Loan application" description="Application details." />
        <ErrorPanel message={error ?? "Could not load this loan application."} onRetry={() => router.refresh()} />
      </div>
    );
  }

  const application = state.application;
  const stages: { label: string; date: string | null; done: boolean; active: boolean }[] = [
    {
      label: "Draft",
      date: application.createdAt,
      done: true,
      active: application.status === "DRAFT",
    },
    {
      label: "Submitted",
      date: application.submittedAt,
      done: application.status !== "DRAFT",
      active: application.status === "SUBMITTED",
    },
    {
      label:
        application.status === "APPROVED"
          ? "Approved"
          : application.status === "REJECTED"
            ? "Rejected"
            : application.status === "CANCELLED"
              ? "Cancelled"
              : "Decision",
      date: application.status !== "DRAFT" && application.status !== "SUBMITTED" ? application.updatedAt : null,
      done: application.status === "APPROVED" || application.status === "REJECTED" || application.status === "CANCELLED",
      active: application.status === "APPROVED" || application.status === "REJECTED" || application.status === "CANCELLED",
    },
  ];

  const canSubmit = state.canEdit && application.status === "DRAFT";
  const canApprove = state.canApprove && application.status === "SUBMITTED";
  const canReject = state.canReject && application.status === "SUBMITTED";
  const canCancel = state.canCancel && (application.status === "DRAFT" || application.status === "SUBMITTED");

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/account-loan-application">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Loan applications
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title={`Loan application ${application.applicationNo}`}
          description="Stage timeline, approvals and documents."
        />
        <Badge variant={application.status === "APPROVED" ? "default" : "outline"}>
          {titleCase(application.status)}
        </Badge>
      </div>

      {actionError ? <FormError message={actionError} /> : null}

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <h2 className="mb-3 fs-text font-semibold text-strong">Stage timeline</h2>
        <ol className="flex flex-col gap-3">
          {stages.map((stage, index) => (
            <li key={stage.label} className="flex items-start gap-3">
              <span
                className={[
                  "grid size-8 shrink-0 place-items-center rounded-full border fs-text font-semibold",
                  stage.done
                    ? "border-primary bg-primary text-on-primary"
                    : "border-card-border bg-subtle text-muted-foreground",
                ].join(" ")}
                aria-hidden="true"
              >
                {stage.done ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
              </span>
              <div className="min-w-0">
                <p className="fs-text font-semibold text-strong">{stage.label}</p>
                <p className="fs-text text-muted-foreground">
                  {stage.date ? new Date(stage.date).toLocaleString() : "Pending"}
                </p>
              </div>
              {index < stages.length - 1 ? (
                <span className="ml-auto h-8 w-px bg-card-border" aria-hidden="true" />
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <h2 className="mb-3 fs-text font-semibold text-strong">Application details</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Client</dt>
            <dd className="mt-0.5 fs-text text-body">
              {application.clientName ?? "N/A"}
              {application.clientReference ? (
                <span className="ml-2 text-muted-foreground">{application.clientReference}</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Product</dt>
            <dd className="mt-0.5 fs-text text-body">{application.productName ?? application.productCode ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Principal</dt>
            <dd className="mt-0.5 fs-text tabular-nums text-body">{formatTzs(application.principalMinor)}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Tenure</dt>
            <dd className="mt-0.5 fs-text text-body">{tenureLabel(application)}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Grace period</dt>
            <dd className="mt-0.5 fs-text text-body">{application.gracePeriodMonths} months</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Interest rate</dt>
            <dd className="mt-0.5 fs-text tabular-nums text-body">{(application.interestRateBp / 100).toFixed(2)}%</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Interest method</dt>
            <dd className="mt-0.5 fs-text text-body">{titleCase(application.interestMethod.replace(/_/g, " "))}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Interest on grace</dt>
            <dd className="mt-0.5 fs-text text-body">{application.interestOnGrace ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Installment start</dt>
            <dd className="mt-0.5 fs-text text-body">
              {application.installmentStartDate ? new Date(application.installmentStartDate).toLocaleDateString() : "N/A"}
            </dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Loan officer</dt>
            <dd className="mt-0.5 fs-text text-body">{application.loanOfficerName ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Debt capacity</dt>
            <dd className="mt-0.5 fs-text tabular-nums text-body">
              {application.debtCapacityMinor ? formatTzs(application.debtCapacityMinor) : "N/A"}
            </dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Economic sector</dt>
            <dd className="mt-0.5 fs-text text-body">{sectorName(application.economicSector, sectors)}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Sub-sector</dt>
            <dd className="mt-0.5 fs-text text-body">{application.subEconomicSector ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Sub-sub sector</dt>
            <dd className="mt-0.5 fs-text text-body">{application.subSubEconomicSector ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Purpose</dt>
            <dd className="mt-0.5 fs-text text-body">{application.purpose ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Has guarantor</dt>
            <dd className="mt-0.5 fs-text text-body">{application.hasGuarantor ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Has collateral</dt>
            <dd className="mt-0.5 fs-text text-body">{application.hasCollateral ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Disbursement preference</dt>
            <dd className="mt-0.5 fs-text text-body">{application.disbursementPreference ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Payment destination</dt>
            <dd className="mt-0.5 fs-text text-body">
              {application.paymentDestination
                ? DESTINATION_LABELS[application.paymentDestination]
                : "N/A"}
            </dd>
          </div>
          {application.paymentDestination === "BANK" ? (
            <>
              <div>
                <dt className="fs-text font-medium tracking-wide text-label">Bank</dt>
                <dd className="mt-0.5 fs-text text-body">{application.bankName ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium tracking-wide text-label">Account name</dt>
                <dd className="mt-0.5 fs-text text-body">{application.bankAccountName ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium tracking-wide text-label">Account number</dt>
                <dd className="mt-0.5 fs-text text-body">{application.bankAccountNumber ?? "N/A"}</dd>
              </div>
            </>
          ) : null}
          {application.paymentDestination === "MNO" ? (
            <>
              <div>
                <dt className="fs-text font-medium tracking-wide text-label">Wallet provider</dt>
                <dd className="mt-0.5 fs-text text-body">{application.mnoProvider ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium tracking-wide text-label">Wallet number</dt>
                <dd className="mt-0.5 fs-text text-body">{application.mnoWalletNumber ?? "N/A"}</dd>
              </div>
            </>
          ) : null}
          <div className="sm:col-span-2">
            <dt className="fs-text font-medium tracking-wide text-label">Description</dt>
            <dd className="mt-0.5 fs-text text-body">{application.description ?? "N/A"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="fs-text font-medium tracking-wide text-label">Remarks</dt>
            <dd className="mt-0.5 fs-text text-body">{application.remarks ?? "N/A"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <h2 className="mb-3 fs-text font-semibold text-strong">Next of kin</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Name</dt>
            <dd className="mt-0.5 fs-text text-body">{application.nomineeName ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Relationship</dt>
            <dd className="mt-0.5 fs-text text-body">{application.nomineeRelation ?? "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Phone</dt>
            <dd className="mt-0.5 fs-text text-body">{application.nomineePhone ? maskPhone(application.nomineePhone) : "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">ID number</dt>
            <dd className="mt-0.5 fs-text text-body">{application.nomineeIdNumber ? maskNationalId(application.nomineeIdNumber) : "N/A"}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Percentage</dt>
            <dd className="mt-0.5 fs-text text-body">
              {application.nomineePercentage !== null ? `${application.nomineePercentage}%` : "N/A"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="fs-text font-semibold text-strong">Documents</h2>
          <span className="fs-text text-muted-foreground">{application.documents.length}</span>
        </div>
        {application.documents.length === 0 ? (
          <EmptyState icon={FileText} title="No documents" description="No attachments were uploaded." />
        ) : (
          <ul className="divide-y divide-card-border">
            {application.documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate fs-text font-medium text-body">{document.name}</p>
                  <p className="fs-text text-muted-foreground">
                    {titleCase(document.kind)} · {Math.round(document.sizeBytes / 1024)} KB
                  </p>
                </div>
                <a
                  href={loanApplicationDocumentUrl(application.id, document.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 fs-text font-medium text-primary"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <h2 className="mb-3 fs-text font-semibold text-strong">Approvals</h2>
        <div className="flex flex-wrap items-center gap-3">
          {canSubmit ? (
            <Button
              onClick={() => void transition("SUBMITTED")}
              disabled={acting !== null}
              aria-busy={acting === "SUBMITTED"}
            >
              {acting === "SUBMITTED" ? "Submitting…" : "Submit application"}
            </Button>
          ) : null}
          {canApprove ? (
            <Button onClick={() => void transition("APPROVED")} disabled={acting !== null} aria-busy={acting === "APPROVED"}>
              {acting === "APPROVED" ? "Approving…" : "Approve"}
            </Button>
          ) : null}
          {canReject ? (
            <Button variant="outline" onClick={() => void transition("REJECTED")} disabled={acting !== null} aria-busy={acting === "REJECTED"}>
              {acting === "REJECTED" ? "Rejecting…" : "Reject"}
            </Button>
          ) : null}
          {canCancel ? (
            <Button variant="outline" onClick={() => void transition("CANCELLED")} disabled={acting !== null} aria-busy={acting === "CANCELLED"}>
              {acting === "CANCELLED" ? "Cancelling…" : "Cancel application"}
            </Button>
          ) : null}
          {!canSubmit && !canApprove && !canReject && !canCancel ? (
            <p className="fs-text text-muted-foreground">No actions available for this application.</p>
          ) : null}
        </div>
        <p className="mt-2 fs-text text-muted-foreground">
          Created {new Date(application.createdAt).toLocaleString()} · Updated {new Date(application.updatedAt).toLocaleString()}
        </p>
      </section>
    </div>
  );
}
