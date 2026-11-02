"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, UserRound } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api";
import { getClient, type Client } from "@/lib/settings";
import { maskEmail, maskNationalId, maskPhone, titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function ClientProfile({ id }: { id: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    void getClient(id)
      .then((response) => {
        if (!active) return;
        setClient(response.client);
      })
      .catch((failure: unknown) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else if (failure instanceof ApiError && failure.status === 404) setNotFound(true);
        else setError(message(failure, "Could not load this client."));
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
        <PageHeader breadcrumb="Client" title="Client profile" description="Client details." />
        <ForbiddenPanel message="Your role cannot view clients. Ask an administrator for Client : View." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-5">
        <PageHeader title="Client profile" description="Client details." />
        <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-24)] text-center">
          <p className="fs-text font-bold text-strong">Client not found</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/clients">Back to clients</Link>
          </Button>
        </div>
      </div>
    );
  }

  const profile = objectValue(client?.profile);
  const residenceDetails = objectValue(profile.residenceDetails);
  const currentResidence = stringValue(residenceDetails.currentAddress) || stringValue(profile.residence);
  const lastResidence = stringValue(residenceDetails.lastAddress);
  const sameAsCurrentResidence = residenceDetails.sameAsCurrent === true;

  return (
    <div className="space-y-5">
      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={10} />
        </section>
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => window.location.reload()} />
      ) : client ? (
        <>
          <section className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-16)]">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex size-[112px] shrink-0 items-center justify-center rounded-full border-2 border-primary bg-subtle text-xl font-medium text-body" aria-hidden="true">
                {client.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || <UserRound className="size-7" />}
              </div>
              <div className="min-w-0">
                <h1 className="truncate fs-heading font-semibold text-strong">{client.fullName}</h1>
                <p className="mt-1 fs-text font-medium text-body">Member ID: {client.memberNo ?? client.referenceNo}</p>
              </div>
            </div>
            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              <div><dt className="fs-text font-medium text-muted-foreground">Status</dt><dd className="mt-1 fs-text text-strong">{titleCase(client.status)}</dd></div>
              <div><dt className="fs-text font-medium text-muted-foreground">KYC Status</dt><dd className="mt-1 fs-text text-strong">{titleCase(client.kycStatus)}</dd></div>
              <div><dt className="fs-text font-medium text-muted-foreground">Phone Number</dt><dd className="mt-1 fs-text text-strong">{maskPhone(client.phone)}</dd></div>
              <div><dt className="fs-text font-medium text-muted-foreground">Type</dt><dd className="mt-1 fs-text text-strong">{titleCase(client.clientType)}</dd></div>
            </dl>
          </section>

          <Tabs defaultValue="summary">
            <TabsList className="max-w-full justify-start overflow-x-auto">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="charges">Charges</TabsTrigger>
              <TabsTrigger value="residence">Residence</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="bank">Bank</TabsTrigger>
              <TabsTrigger value="verification-history">Verification History</TabsTrigger>
              <TabsTrigger value="statement">Statement</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
                <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-14)] md:grid-cols-2 lg:grid-cols-3">
                  <div><dt className="fs-text font-medium text-muted-foreground">Reference Number</dt><dd className="mt-1 fs-text text-strong">{client.referenceNo}</dd></div>
                  <div><dt className="fs-text font-medium text-muted-foreground">Full Name</dt><dd className="mt-1 fs-text text-strong">{client.fullName}</dd></div>
                  <div><dt className="fs-text font-medium text-muted-foreground">Email Address</dt><dd className="mt-1 fs-text text-strong">{maskEmail(client.email)}</dd></div>
                  <div><dt className="fs-text font-medium text-muted-foreground">National ID</dt><dd className="mt-1 fs-text text-strong">{maskNationalId(client.nationalId)}</dd></div>
                  <div><dt className="fs-text font-medium text-muted-foreground">Date Of Joining</dt><dd className="mt-1 fs-text text-strong">{client.joinedAt ? new Date(client.joinedAt).toLocaleDateString() : "N/A"}</dd></div>
                  <div><dt className="fs-text font-medium text-muted-foreground">Group Name</dt><dd className="mt-1 fs-text text-strong">{client.groupName ?? "N/A"}</dd></div>
                  <div><dt className="fs-text font-medium text-muted-foreground">Branch</dt><dd className="mt-1 fs-text text-strong">{client.branchName ?? "N/A"}</dd></div>
                </dl>
              </section>
            </TabsContent>

            {["kyc", "users", "accounts", "charges", "income", "assets", "bank", "verification-history", "statement", "history"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <EmptyState
                  icon={Building2}
                  title={`${tab.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")} not available yet`}
                  description="No local records are available for this section."
                />
              </TabsContent>
            ))}

            <TabsContent value="residence">
              {currentResidence || lastResidence ? (
                <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
                  <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-14)] md:grid-cols-2">
                    <div>
                      <dt className="fs-text font-medium text-muted-foreground">Current Residence Address</dt>
                      <dd className="mt-1 fs-text text-strong">{currentResidence || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="fs-text font-medium text-muted-foreground">Last Residence Address</dt>
                      <dd className="mt-1 fs-text text-strong">
                        {sameAsCurrentResidence ? "Same as current residence" : lastResidence || "N/A"}
                      </dd>
                    </div>
                  </dl>
                </section>
              ) : (
                <EmptyState icon={Building2} title="Residence not available yet" description="No local records are available for this section." />
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
