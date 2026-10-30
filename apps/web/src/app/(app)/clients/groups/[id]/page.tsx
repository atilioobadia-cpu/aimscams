"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { useParams } from "next/navigation";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { listClients, type Client } from "@/lib/settings";
import { titleCase } from "@/lib/privacy";

function failureMessage(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function ClientGroupDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [group, setGroup] = useState<Client | null>(null);
  const [members, setMembers] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void Promise.all([
      listClients({ type: "GROUP", q: undefined }),
      listClients({ groupId: id }),
    ])
      .then(([groups, mems]) => {
        if (cancelled) return;
        const found = groups.items.find((g) => g.id === id) ?? null;
        setGroup(found);
        setMembers(mems.items);
        setForbidden(false);
      })
      .catch((failure: unknown) => {
        if (cancelled) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setForbidden(true);
        } else {
          setError(failureMessage(failure, "Could not load this group."));
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
        <PageHeader title="Client group" description="Group details." />
        <ForbiddenPanel message="Your role cannot view clients. Ask an administrator for Client : View." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Client group" description="Group details." />
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="space-y-5">
        <PageHeader title="Client group" description="Group details." />
        <ErrorPanel message={error ?? "Group not found."} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/clients">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Clients
          </Link>
        </Button>
      </div>

      <PageHeader title={group.fullName} description="Client group details." breadcrumb="Clients" />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Reference</dt>
            <dd className="mt-0.5 fs-text text-body">{group.referenceNo}</dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Status</dt>
            <dd className="mt-0.5 fs-text text-body">
              <Badge variant={group.status === "ACTIVE" ? "default" : "outline"}>{titleCase(group.status)}</Badge>
            </dd>
          </div>
          <div>
            <dt className="fs-text font-medium tracking-wide text-label">Members</dt>
            <dd className="mt-0.5 fs-text text-body">{members.length}</dd>
          </div>
        </dl>
      </section>

      <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
        <div className="border-b border-card-border px-[var(--space-16)] py-[var(--space-10)]">
          <p className="fs-text text-muted-foreground">{members.length} member{members.length === 1 ? "" : "s"}</p>
        </div>
        {members.length === 0 ? (
          <EmptyState icon={Users} title="No members yet" description="Add members to this group from the client form." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Reference</th>
                  <th className="whitespace-nowrap px-4 py-3">Name</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                  <th className="whitespace-nowrap px-4 py-3">KYC</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-card-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{m.referenceNo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{m.fullName}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={m.status === "ACTIVE" ? "default" : "outline"}>{titleCase(m.status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(m.kycStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
