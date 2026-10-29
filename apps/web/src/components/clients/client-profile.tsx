"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

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

  const profile = (client?.profile ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/clients">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Clients
          </Link>
        </Button>
      </div>

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={10} />
        </section>
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => window.location.reload()} />
      ) : client ? (
        <>
          <PageHeader title={`${client.memberNo ?? client.referenceNo} — ${client.fullName}`} description="Client profile." />

          <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--space-16)]">
            <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-14)] md:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="fs-text font-medium text-muted-foreground">Member ID</dt>
                <dd className="mt-1 fs-text text-strong">{client.memberNo ?? client.referenceNo}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">Reference number</dt>
                <dd className="mt-1 fs-text text-strong">{client.referenceNo}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">Full name</dt>
                <dd className="mt-1 fs-text text-strong">{client.fullName}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">Type</dt>
                <dd className="mt-1 fs-text text-strong">{titleCase(client.clientType)}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">Phone</dt>
                <dd className="mt-1 fs-text text-strong">{maskPhone(client.phone)}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">Email</dt>
                <dd className="mt-1 fs-text text-strong">{maskEmail(client.email)}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">National ID</dt>
                <dd className="mt-1 fs-text text-strong">{maskNationalId(client.nationalId)}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1 fs-text text-strong">{titleCase(client.status)}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">KYC status</dt>
                <dd className="mt-1 fs-text text-strong">{titleCase(client.kycStatus)}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">DOJ</dt>
                <dd className="mt-1 fs-text text-strong">{client.joinedAt ? new Date(client.joinedAt).toLocaleDateString() : "N/A"}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">Group</dt>
                <dd className="mt-1 fs-text text-strong">{client.groupName ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="fs-text font-medium text-muted-foreground">Branch</dt>
                <dd className="mt-1 fs-text text-strong">{client.branchName ?? "N/A"}</dd>
              </div>
            </dl>
          </section>

          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="residence">Residence</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="bank">Bank</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="charges">Charges</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="statement">Statement</TabsTrigger>
              <TabsTrigger value="transaction">Transaction</TabsTrigger>
              <TabsTrigger value="mno">MNO</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
                <pre className="overflow-auto fs-text text-body">{JSON.stringify(profile, null, 2)}</pre>
              </div>
            </TabsContent>

            {["kyc", "income", "residence", "assets", "bank", "members", "users", "charges", "history", "statement", "transaction", "mno"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <EmptyState
                  icon={Building2}
                  title={`${tab.charAt(0).toUpperCase()}${tab.slice(1)} not available yet`}
                  description="This tab will be populated as the client module grows."
                />
              </TabsContent>
            ))}
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
