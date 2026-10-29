"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Eye, Plus, Search, UserCheck, UserX } from "lucide-react";
import Link from "next/link";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { RowActionsMenu, type RowAction } from "@/components/data/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { listClients, updateClient, type Client, type ClientStatus, type ClientType } from "@/lib/settings";
import { maskEmail, maskNationalId, maskPhone, nationalIdPattern } from "@/lib/privacy";
import { titleCase } from "@/lib/privacy";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function ClientsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof listClients>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [clientType, setClientType] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);
  const { pushToast } = useToast();
  const [viewing, setViewing] = useState<Client | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listClients({ q: query, status, type: clientType })
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
              setError(message(failure, "Could not load clients."));
            }
          })
          .finally(() => {
            if (cancelled) return;
            firstLoad.current = false;
            setLoading(false);
          });
      },
      firstLoad.current ? 0 : 250,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, status, clientType, reloadKey]);

  const items = data?.items ?? [];
  const hasFilters = Boolean(query.trim() || status || clientType);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader breadcrumb="Client" title="Clients" description="Members, borrowers and groups registered at this branch." />
        {data?.canCreate ? (
          <div className="flex gap-2">
            <Button asChild className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
              <Link href="/clients/create">Add client</Link>
            </Button>
            <Button asChild variant="outline" className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
              <Link href="/clients/create-group">Add group</Link>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="client-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="client-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Reference, name, phone or national ID"
                className="h-[var(--control-height)] pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-[180px]">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="client-type">
              Type
            </label>
            <select
              id="client-type"
              value={clientType}
              onChange={(event) => setClientType(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="">All types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="GROUP">Group</option>
            </select>
          </div>
          <div className="w-full md:w-[180px]">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="client-status">
              Status
            </label>
            <select
              id="client-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view clients. Ask an administrator for Client : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No client matches" : "No clients yet"}
          description={hasFilters ? "Adjust or clear the filters to see other clients." : "Add a client to begin."}
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">Member ID</th>
                  <th className="px-4 py-3">Full name</th>
                  <th className="px-4 py-3">Ref number</th>
                  <th className="px-4 py-3">National ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">KYC status</th>
                  <th className="px-4 py-3">DOJ</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: Client) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="px-4 py-3 font-medium text-strong">{item.memberNo ?? item.referenceNo}</td>
                    <td className="px-4 py-3 text-body">{item.fullName}</td>
                    <td className="px-4 py-3 text-body">{item.referenceNo}</td>
                    <td className="px-4 py-3 text-body">{maskNationalId(item.nationalId)}</td>
                    <td className="px-4 py-3 text-body">{item.clientType}</td>
                    <td className="px-4 py-3 text-body">{maskPhone(item.phone)}</td>
                    <td className="px-4 py-3 text-body">{maskEmail(item.email)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>{titleCase(item.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-body">{titleCase(item.kycStatus)}</td>
                    <td className="px-4 py-3 text-body">{item.joinedAt ? new Date(item.joinedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-body">{item.groupName ?? "N/A"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <RowActionsMenu
                          label={`${item.referenceNo} ${item.fullName}`}
                          actions={[
                            { label: "View client", icon: Eye, href: `/clients/${item.id}` },
                            ...(data?.canEdit
                              ? [
                                  {
                                    label: item.status === "ACTIVE" ? "Deactivate client" : "Activate client",
                                    icon: item.status === "ACTIVE" ? UserX : UserCheck,
                                    onSelect: async () => {
                                      const next = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                                      await updateClient(item.id, { status: next });
                                      pushToast(`Client ${next === "ACTIVE" ? "activated" : "deactivated"}.`);
                                      setReloadKey((value) => value + 1);
                                    },
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing ? `${viewing.fullName}` : "Client details"}
        footer={
          <Button variant="outline" onClick={() => setViewing(null)}>
            Close
          </Button>
        }
      >
        {viewing ? (
          <dl className="grid gap-x-[var(--space-24)] gap-y-[var(--space-14)] md:grid-cols-2">
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Member ID</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.memberNo ?? viewing.referenceNo}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Reference number</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.referenceNo}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">National ID</dt>
              <dd className="mt-1 fs-text text-strong">{maskNationalId(viewing.nationalId)}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Type</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.clientType}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Phone</dt>
              <dd className="mt-1 fs-text text-strong">{maskPhone(viewing.phone)}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1 fs-text text-strong">{maskEmail(viewing.email)}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.status}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">KYC status</dt>
              <dd className="mt-1 fs-text text-strong">{titleCase(viewing.kycStatus)}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">DOJ</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.joinedAt ? new Date(viewing.joinedAt).toLocaleDateString() : "—"}</dd>
            </div>
            <div>
              <dt className="fs-text font-medium text-muted-foreground">Group</dt>
              <dd className="mt-1 fs-text text-strong">{viewing.groupName ?? "N/A"}</dd>
            </div>
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
