"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { useParams } from "next/navigation";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api";
import {
  getClient,
  listBranches,
  listClients,
  listLoanOfficers,
  listMembershipPolicies,
  listLoanApplications,
  listLoans,
  listSavingsAccounts,
  type Branch,
  type Client,
  type LoanOfficer,
  type MembershipPolicy,
  type Loan,
  type LoanApplication,
  type SavingsAccount,
} from "@/lib/settings";
import { titleCase } from "@/lib/privacy";
import { formatTzs } from "@/lib/format";

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
}

function display(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "N/A";
  return value;
}

function matchesGroup<T extends { clientName: string | null; clientReference: string | null }>(items: T[], group: Client): T[] {
  return items.filter((item) => item.clientReference === group.referenceNo || item.clientName === group.fullName);
}

function failureMessage(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function DetailValue({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <dt className="fs-text text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words fs-text text-body">{display(value)}</dd>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <EmptyState
      icon={Users}
      title={label + " data is not available yet"}
      description="This section is not connected to AIMSCAMS client data yet."
    />
  );
}

export default function ClientGroupDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [group, setGroup] = useState<Client | null>(null);
  const [members, setMembers] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [policies, setPolicies] = useState<MembershipPolicy[]>([]);
  const [managers, setManagers] = useState<LoanOfficer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsIssue, setAccountsIssue] = useState(false);
  const [canCreateLoanApplication, setCanCreateLoanApplication] = useState(false);
  const [canCreateSavingsAccount, setCanCreateSavingsAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setForbidden(false);

    void Promise.all([
      getClient(id),
      listClients({ groupId: id }),
      listBranches().catch(() => ({ items: [] as Branch[] })),
      listMembershipPolicies().catch(() => ({ items: [] as MembershipPolicy[] })),
      listLoanOfficers().catch(() => ({ items: [] as LoanOfficer[] })),
    ])
      .then(([clientResponse, memberResponse, branchResponse, policyResponse, managerResponse]) => {
        if (cancelled) return;
        setGroup(clientResponse.client.clientType === "GROUP" ? clientResponse.client : null);
        setMembers(memberResponse.items);
        setBranches(branchResponse.items);
        setPolicies(policyResponse.items);
        setManagers(managerResponse.items);
      })
      .catch((failure: unknown) => {
        if (cancelled) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else setError(failureMessage(failure, "Could not load this group."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!group) return;
    let cancelled = false;
    setAccountsLoading(true);
    setAccountsIssue(false);

    void Promise.all([
      listLoans({ q: group.fullName }).catch(() => null),
      listLoanApplications({ q: group.fullName }).catch(() => null),
      listSavingsAccounts({ q: group.fullName }).catch(() => null),
    ])
      .then(([loanResponse, applicationResponse, savingsResponse]) => {
        if (cancelled) return;
        setLoans(loanResponse ? matchesGroup(loanResponse.items, group) : []);
        setApplications(applicationResponse ? matchesGroup(applicationResponse.items, group) : []);
        setSavingsAccounts(savingsResponse ? matchesGroup(savingsResponse.items, group) : []);
        setCanCreateLoanApplication(Boolean(applicationResponse?.canCreate));
        setCanCreateSavingsAccount(Boolean(savingsResponse?.canCreate));
        setAccountsIssue(!loanResponse || !applicationResponse || !savingsResponse);
      })
      .finally(() => {
        if (!cancelled) setAccountsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [group]);
  const profile = useMemo(() => asRecord(group?.profile), [group?.profile]);
  const membership = asRecord(profile.membership);
  const groupDetails = asRecord(profile.group);
  const meeting = asRecord(profile.meeting);
  const contact = asRecord(profile.contact);
  const branch = branches.find((item) => item.id === membership.branchId);
  const policy = policies.find((item) => item.id === membership.membershipPolicyId);
  const manager = managers.find((item) => item.id === membership.relationshipManagerId);
  const branchName = group?.branchName ?? branch?.name;
  const policyName = policy?.name ?? membership.membershipPolicyName;
  const managerName = manager?.fullName ?? membership.relationshipManagerName;
  const groupName = groupDetails.name ?? group?.fullName;
  const meetingSchedule = [meeting.day, meeting.time].filter((value) => typeof value === "string" && value.trim()).join(" / ");

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
        {error ? <ErrorPanel message={error} /> : <ErrorPanel message="Group not found." />}
        <Button asChild variant="outline" size="sm">
          <Link href="/clients"><ArrowLeft className="size-4" aria-hidden="true" />Clients</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-[10px]">
      <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(110px,0.65fr)_minmax(130px,0.8fr)_minmax(170px,1fr)]">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-[64px] shrink-0 items-center justify-center rounded-full bg-subtle fs-title font-medium text-muted-foreground" aria-hidden="true">C1</div>
            <div className="min-w-0">
              <h1 className="break-words fs-title font-bold leading-tight text-heading">{group.fullName}</h1>
              <p className="mt-1 fs-text text-body">{group.memberNo ?? group.referenceNo}</p>
            </div>
          </div>
          <dl>
            <dt className="fs-text font-semibold text-label">Status</dt>
            <dd className="mt-1"><Badge variant={group.status === "ACTIVE" ? "default" : "outline"}>{titleCase(group.status)}</Badge></dd>
          </dl>
          <dl>
            <dt className="fs-text font-semibold text-label">Total Members</dt>
            <dd className="mt-1 fs-text text-body">{members.length}</dd>
          </dl>
          <dl>
            <dt className="fs-text font-semibold text-label">Meeting Schedule</dt>
            <dd className="mt-1 fs-text text-body">{meetingSchedule || "N/A"}</dd>
          </dl>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <dl><dt className="fs-text font-semibold text-label">Branch</dt><dd className="mt-1 fs-text text-body">{display(branchName)}</dd></dl>
          <dl><dt className="fs-text font-semibold text-label">Manager</dt><dd className="mt-1 fs-text text-body">{display(managerName)}</dd></dl>
        </div>
      </section>

      <Tabs defaultValue="details" className="gap-4">
        <div className="overflow-x-auto border-b border-card-border">
          <TabsList variant="line" className="h-[var(--tab-strip-height)] w-max min-w-full justify-start gap-0 rounded-none bg-surface p-0">
            {[
              ["details", "Details"], ["members", "Members"], ["users", "Users"], ["accounts", "Accounts"],
              ["charges", "Charges"], ["residence", "Residence"], ["kyc", "KYC"], ["income", "Income"],
              ["assets", "Assets"], ["bank", "Bank"], ["history", "History"], ["statement", "Statement"],
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="h-full flex-none rounded-none px-4">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="details">
          <div className="space-y-4">
            <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-4 md:p-5">
              <h2 className="mb-4 fs-subtitle font-semibold text-heading">Membership Details</h2>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailValue label="Member ID" value={group.memberNo ?? group.referenceNo} />
                <DetailValue label="Status" value={titleCase(group.status)} />
                <DetailValue label="Client Manager" value={managerName} />
                <DetailValue label="Type" value="Group" />
                <DetailValue label="Reference Number" value={group.referenceNo} />
                <DetailValue label="Branch Name" value={branchName} />
                <DetailValue label="Policy" value={policyName} />
                <DetailValue label="Group Name" value={groupName} />
                <DetailValue label="Group Type" value={groupDetails.type} />
              </dl>
            </section>

            <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-4 md:p-5">
              <h2 className="mb-4 fs-subtitle font-semibold text-heading">Contact Information</h2>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailValue label="Phone" value={group.phone ?? contact.phone} />
                <DetailValue label="MNO" value={contact.mno} />
                <DetailValue label="Office Number" value={contact.officeNumber} />
                <DetailValue label="Region" value={contact.region} />
                <DetailValue label="District" value={contact.district} />
                <DetailValue label="Ward" value={contact.ward} />
              </dl>
            </section>

            <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-4 md:p-5">
              <h2 className="mb-4 fs-subtitle font-semibold text-heading">Group Meeting Day</h2>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailValue label="Frequency" value={meeting.frequency} />
                <DetailValue label="Recurrence Day" value={meeting.day} />
                <DetailValue label="Meeting Time" value={meeting.time} />
                <DetailValue label="Meeting Place" value={meeting.place} />
              </dl>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
            <div className="border-b border-card-border px-4 py-3">
              <p className="fs-text text-muted-foreground">{members.length} member{members.length === 1 ? "" : "s"}</p>
            </div>
            {members.length === 0 ? (
              <EmptyState icon={Users} title="No members yet" description="Members linked to this group will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left fs-text">
                  <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3">Member Id</th>
                      <th className="whitespace-nowrap px-4 py-3">Name</th>
                      <th className="whitespace-nowrap px-4 py-3">Member Type</th>
                      <th className="whitespace-nowrap px-4 py-3">Phone Number</th>
                      <th className="whitespace-nowrap px-4 py-3">Email ID</th>
                      <th className="whitespace-nowrap px-4 py-3">Status</th>
                      <th className="whitespace-nowrap px-4 py-3">Reference Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-b border-card-border last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{member.memberNo ?? "N/A"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-body">{member.fullName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(member.clientType)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-body">{display(member.phone)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-body">{display(member.email)}</td>
                        <td className="whitespace-nowrap px-4 py-3"><Badge variant={member.status === "ACTIVE" ? "default" : "outline"}>{titleCase(member.status)}</Badge></td>
                        <td className="whitespace-nowrap px-4 py-3 text-body">{member.referenceNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="users"><ComingSoon label="Users" /></TabsContent>
        <TabsContent value="accounts">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--card-radius)] border border-card-border bg-card p-4">
              <div>
                <h2 className="fs-subtitle font-semibold text-heading">Accounts</h2>
                <p className="mt-1 fs-text text-muted-foreground">Accounts held by this group.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canCreateLoanApplication ? <Button asChild variant="outline" size="sm"><Link href={"/account-loan-application-create?clientId=" + encodeURIComponent(group.id)}>New loan application</Link></Button> : null}
                {canCreateSavingsAccount ? <Button asChild variant="outline" size="sm"><Link href={"/account-saving?clientId=" + encodeURIComponent(group.id) + "&open=1"}>Add saving</Link></Button> : null}
              </div>
            </div>
            {accountsIssue ? <p role="status" className="fs-text text-muted-foreground">Some account information could not be loaded with your current access.</p> : null}
            {accountsLoading ? (
              <section className="rounded-[var(--card-radius)] border border-card-border bg-surface"><PanelSkeleton rows={5} /></section>
            ) : (
              <>
                <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
                  <h3 className="border-b border-card-border px-4 py-3 fs-text font-semibold text-heading">Loan Applications</h3>
                  {applications.length === 0 ? <EmptyState icon={Users} title="No loan applications" description="Loan applications for this group will appear here." /> : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left fs-text">
                        <thead className="border-b border-card-border bg-subtle font-semibold text-label"><tr><th className="px-4 py-3">Application</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Principal</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Action</th></tr></thead>
                        <tbody>{applications.map((application) => (
                          <tr key={application.id} className="border-b border-card-border last:border-0">
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{application.applicationNo}</td>
                            <td className="px-4 py-3 text-body">{display(application.productName)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-body">{formatTzs(application.principalMinor)}</td>
                            <td className="px-4 py-3 text-body">{titleCase(application.status)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-body">{new Date(application.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3"><Button asChild variant="outline" size="sm"><Link href={"/account-loan-application-details/" + application.id}>View</Link></Button></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
                  <h3 className="border-b border-card-border px-4 py-3 fs-text font-semibold text-heading">Loans</h3>
                  {loans.length === 0 ? <EmptyState icon={Users} title="No loans" description="Loans held by this group will appear here." /> : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left fs-text">
                        <thead className="border-b border-card-border bg-subtle font-semibold text-label"><tr><th className="px-4 py-3">Loan Number</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Principal</th><th className="px-4 py-3">Outstanding</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead>
                        <tbody>{loans.map((loan) => (
                          <tr key={loan.id} className="border-b border-card-border last:border-0">
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{loan.loanNumber}</td>
                            <td className="px-4 py-3 text-body">{display(loan.productName)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-body">{formatTzs(loan.principalMinor)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-body">{formatTzs(loan.outstandingPrincipalMinor)}</td>
                            <td className="px-4 py-3 text-body">{titleCase(loan.status)}</td>
                            <td className="px-4 py-3"><Button asChild variant="outline" size="sm"><Link href={"/account-loan-details/" + loan.id}>View Balance</Link></Button></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
                  <h3 className="border-b border-card-border px-4 py-3 fs-text font-semibold text-heading">Savings Accounts</h3>
                  {savingsAccounts.length === 0 ? <EmptyState icon={Users} title="No savings accounts" description="Savings accounts held by this group will appear here." /> : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left fs-text">
                        <thead className="border-b border-card-border bg-subtle font-semibold text-label"><tr><th className="px-4 py-3">Account Number</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Status</th></tr></thead>
                        <tbody>{savingsAccounts.map((account) => (
                          <tr key={account.id} className="border-b border-card-border last:border-0">
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{account.accountNumber}</td>
                            <td className="px-4 py-3 text-body">{display(account.productName)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-body">{formatTzs(account.balanceMinor)}</td>
                            <td className="px-4 py-3 text-body">{titleCase(account.status)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </TabsContent>
        <TabsContent value="charges"><ComingSoon label="Charges" /></TabsContent>
        <TabsContent value="residence"><ComingSoon label="Residence" /></TabsContent>
        <TabsContent value="kyc"><ComingSoon label="KYC" /></TabsContent>
        <TabsContent value="income"><ComingSoon label="Income" /></TabsContent>
        <TabsContent value="assets"><ComingSoon label="Assets" /></TabsContent>
        <TabsContent value="bank"><ComingSoon label="Bank" /></TabsContent>
        <TabsContent value="history"><ComingSoon label="History" /></TabsContent>
        <TabsContent value="statement"><ComingSoon label="Statement" /></TabsContent>
      </Tabs>
    </div>
  );
}