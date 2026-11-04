"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Mail, Search, Users } from "lucide-react";
import { useParams } from "next/navigation";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  updateClient,
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
import { listTransactions, type Transaction } from "@/lib/transactions";

const STATEMENT_PAGE_SIZE = 100;

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
}

function display(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "N/A";
  return value;
}

function initialsFor(value: unknown): string {
  const name = display(value);
  if (name === "N/A") return "GR";
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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
  const [canEditGroup, setCanEditGroup] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberCandidates, setMemberCandidates] = useState<Client[]>([]);
  const [memberCandidatesLoading, setMemberCandidatesLoading] = useState(false);
  const [memberCandidatesError, setMemberCandidatesError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberSaveError, setMemberSaveError] = useState<string | null>(null);
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
  const [statementStartDate, setStatementStartDate] = useState("");
  const [statementEndDate, setStatementEndDate] = useState("");
  const [statementAppliedStartDate, setStatementAppliedStartDate] = useState("");
  const [statementAppliedEndDate, setStatementAppliedEndDate] = useState("");
  const [statementRows, setStatementRows] = useState<Transaction[]>([]);
  const [statementTotal, setStatementTotal] = useState(0);
  const [statementPage, setStatementPage] = useState(1);
  const [statementLoaded, setStatementLoaded] = useState(false);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementDownloading, setStatementDownloading] = useState(false);
  const [statementError, setStatementError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

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
        setCanEditGroup(clientResponse.canEdit);
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
    const query = memberSearch.trim();
    if (!addMemberOpen || query.length < 2) return;

    let cancelled = false;
    setMemberCandidatesLoading(true);
    setMemberCandidatesError(null);
    const timeout = window.setTimeout(() => {
      void listClients({ type: "INDIVIDUAL", q: query })
        .then((response) => {
          if (cancelled) return;
          setMemberCandidates(response.items.filter((client) => !client.groupName));
        })
        .catch((failure: unknown) => {
          if (!cancelled) setMemberCandidatesError(failureMessage(failure, "Could not search clients."));
        })
        .finally(() => {
          if (!cancelled) setMemberCandidatesLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [addMemberOpen, memberSearch]);

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
  const groupDisplayName = display(groupName);
  const groupInitials = initialsFor(groupName);
  const meetingSchedule = [meeting.day, meeting.time].filter((value) => typeof value === "string" && value.trim()).join(" / ");

  const statementPageCount = Math.max(1, Math.ceil(statementTotal / STATEMENT_PAGE_SIZE));

  async function loadStatement(
    pageNumber = 1,
    startDate = statementAppliedStartDate,
    endDate = statementAppliedEndDate,
  ) {
    if (!group) return;
    setStatementError(null);
    setStatementLoading(true);
    try {
      const response = await listTransactions({
        clientId: group.id,
        from: startDate || undefined,
        to: endDate || undefined,
        page: pageNumber,
        pageSize: STATEMENT_PAGE_SIZE,
      });
      setStatementRows(response.items);
      setStatementTotal(response.total);
      setStatementPage(response.page);
      setStatementAppliedStartDate(startDate);
      setStatementAppliedEndDate(endDate);
      setStatementLoaded(true);
    } catch (failure) {
      setStatementError(failureMessage(failure, "Could not load this statement."));
    } finally {
      setStatementLoading(false);
    }
  }

  async function downloadStatement() {
    if (!group || statementTotal === 0) return;
    setStatementError(null);
    setStatementDownloading(true);
    try {
      const pageCount = Math.ceil(statementTotal / STATEMENT_PAGE_SIZE);
      const transactions: Transaction[] = [];
      for (let page = 1; page <= pageCount; page += 1) {
        const result = await listTransactions({
          clientId: group.id,
          from: statementAppliedStartDate || undefined,
          to: statementAppliedEndDate || undefined,
          page,
          pageSize: STATEMENT_PAGE_SIZE,
        });
        transactions.push(...result.items);
      }
      const fields = [
        ["Transaction No", "Value Date", "Type", "Narration", "Debit", "Credit", "Status"],
        ...transactions.map((transaction) => [
          transaction.transactionNo,
          transaction.valueDate,
          transaction.type,
          transaction.narration,
          transaction.drCr === "DR" ? formatTzs(transaction.amountMinor) : "",
          transaction.drCr === "CR" ? formatTzs(transaction.amountMinor) : "",
          transaction.status,
        ]),
      ];
      const csv = fields.map((row) => row.map((value) => '"' + String(value).replaceAll('"', '""') + '"').join(",")).join("\r\n");
      const objectUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "group-" + group.referenceNo + "-statement.csv";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (failure) {
      setStatementError(failureMessage(failure, "Could not download this statement."));
    } finally {
      setStatementDownloading(false);
    }
  }

  function submitStatement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (statementStartDate && statementEndDate && statementStartDate > statementEndDate) {
      setStatementError("Start Date must be on or before End Date.");
      return;
    }
    void loadStatement(1, statementStartDate, statementEndDate);
  }

  async function addSelectedMember() {
    if (!group || !selectedMemberId) return;
    setMemberSaveError(null);
    setMemberSaving(true);
    try {
      const response = await updateClient(selectedMemberId, { groupId: group.id });
      setMembers((current) => [
        ...current.filter((member) => member.id !== response.client.id),
        response.client,
      ]);
      setAddMemberOpen(false);
      setMemberSearch("");
      setSelectedMemberId(null);
    } catch (failure) {
      setMemberSaveError(failureMessage(failure, "Could not add this client to the group."));
    } finally {
      setMemberSaving(false);
    }
  }


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
            <div className="flex size-[64px] shrink-0 items-center justify-center rounded-full bg-subtle fs-title font-medium text-muted-foreground" aria-hidden="true">{groupInitials}</div>
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
            <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,2.8fr)]">
              <section className="flex flex-col items-center justify-center rounded-[var(--card-radius)] border border-card-border bg-card p-5 text-center">
                <div className="flex size-32 items-center justify-center rounded-full border-2 border-card-border bg-subtle fs-title font-medium text-muted-foreground" aria-hidden="true">{groupInitials}</div>
                <h2 className="mt-4 max-w-full break-words fs-subtitle font-semibold text-heading">{groupDisplayName}</h2>
                <p className="mt-1 fs-text text-muted-foreground">Group</p>
              </section>

              <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-4 md:p-5">
                <h2 className="mb-4 flex items-center gap-2 fs-subtitle font-semibold text-heading"><Users className="size-4 text-primary" aria-hidden="true" />Membership Details</h2>
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailValue label="Member Id" value={group.memberNo ?? group.referenceNo} />
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
            </div>

            <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-4 md:p-5">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h2 className="mb-4 flex items-center gap-2 fs-subtitle font-semibold text-heading"><Mail className="size-4 text-primary" aria-hidden="true" />Contact Information</h2>
                  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    <DetailValue label="Phone" value={group.phone ?? contact.phone} />
                    <DetailValue label="MNO" value={contact.mno} />
                    <DetailValue label="Office Number" value={contact.officeNumber} />
                    <DetailValue label="Region" value={contact.region} />
                    <DetailValue label="District" value={contact.district} />
                    <DetailValue label="Ward" value={contact.ward} />
                  </dl>
                </div>

                <div>
                  <h2 className="mb-4 flex items-center gap-2 fs-subtitle font-semibold text-heading"><CalendarDays className="size-4 text-primary" aria-hidden="true" />Group Meeting Day</h2>
                  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    <DetailValue label="Frequency" value={meeting.frequency} />
                    <DetailValue label="Recurrence Day" value={meeting.day} />
                    <DetailValue label="Meeting Time" value={meeting.time} />
                    <DetailValue label="Meeting Place" value={meeting.place} />
                  </dl>
                </div>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border px-4 py-3">
              <p className="fs-text text-muted-foreground">{members.length} member{members.length === 1 ? "" : "s"}</p>
              {canEditGroup ? <Button type="button" variant="outline" size="sm" onClick={() => { setMemberSearch(""); setSelectedMemberId(null); setMemberSaveError(null); setAddMemberOpen(true); }}>Add Group Member</Button> : null}
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

        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
          <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Group Member</DialogTitle>
              <DialogDescription>Search for an individual client who is not assigned to another group.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <label className="relative block" htmlFor="group-member-search">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="group-member-search" value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Name, reference number, or phone" className="pl-9" />
              </label>
              <div aria-live="polite" className="max-h-64 overflow-y-auto rounded-[var(--card-radius)] border border-card-border">
                {memberSearch.trim().length < 2 ? (
                  <p className="px-4 py-8 text-center fs-text text-muted-foreground">Enter at least two characters to search.</p>
                ) : memberCandidatesLoading ? (
                  <p className="px-4 py-8 text-center fs-text text-muted-foreground">Searching clients...</p>
                ) : memberCandidatesError ? (
                  <p role="alert" className="px-4 py-8 text-center fs-text text-destructive">{memberCandidatesError}</p>
                ) : memberCandidates.length === 0 ? (
                  <p className="px-4 py-8 text-center fs-text text-muted-foreground">No unassigned individual clients found.</p>
                ) : (
                  <ul className="divide-y divide-card-border">
                    {memberCandidates.map((candidate) => (
                      <li key={candidate.id}>
                        <button type="button" aria-pressed={selectedMemberId === candidate.id} onClick={() => setSelectedMemberId(candidate.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <span className="min-w-0">
                            <span className="block truncate fs-text font-medium text-strong">{candidate.fullName}</span>
                            <span className="mt-1 block truncate fs-text text-muted-foreground">{candidate.referenceNo}{candidate.phone ? ` · ${candidate.phone}` : ""}</span>
                          </span>
                          <span className="shrink-0 fs-text text-primary">{selectedMemberId === candidate.id ? "Selected" : "Select"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {memberSaveError ? <p role="alert" className="fs-text text-destructive">{memberSaveError}</p> : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddMemberOpen(false)} disabled={memberSaving}>Cancel</Button>
              <Button type="button" onClick={() => void addSelectedMember()} disabled={!selectedMemberId || memberSaving}>{memberSaving ? "Adding..." : "Add Member"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
        <TabsContent value="statement">
          <div className="space-y-4">
            <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <form className="flex flex-wrap items-end gap-3" onSubmit={submitStatement}>
                  <div>
                    <label className="mb-1 block fs-text font-medium text-body" htmlFor="group-statement-start">Start Date</label>
                    <input id="group-statement-start" type="date" value={statementStartDate} onChange={(event) => setStatementStartDate(event.target.value)} className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body" />
                  </div>
                  <div>
                    <label className="mb-1 block fs-text font-medium text-body" htmlFor="group-statement-end">End Date</label>
                    <input id="group-statement-end" type="date" value={statementEndDate} onChange={(event) => setStatementEndDate(event.target.value)} className="h-[var(--control-height)] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text text-body" />
                  </div>
                  <Button type="submit" variant="outline" disabled={statementLoading}>{statementLoading ? "Loading..." : "Submit"}</Button>
                </form>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => window.print()} disabled={!statementLoaded || statementRows.length === 0}>Print</Button>
                  <Button type="button" variant="outline" onClick={() => void downloadStatement()} disabled={!statementLoaded || statementTotal === 0 || statementDownloading}>
                    {statementDownloading ? "Preparing..." : "Download"}
                  </Button>
                </div>
              </div>
            </section>

            {statementError ? <ErrorPanel message={statementError} /> : null}
            <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
              {statementLoading ? <PanelSkeleton rows={6} /> : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left fs-text">
                      <thead className="border-b border-card-border bg-subtle font-semibold tracking-wide text-label">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-3">Transaction No</th>
                          <th className="whitespace-nowrap px-4 py-3">Date</th>
                          <th className="whitespace-nowrap px-4 py-3">Type</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="whitespace-nowrap px-4 py-3 text-right">Debit</th>
                          <th className="whitespace-nowrap px-4 py-3 text-right">Credit</th>
                          <th className="whitespace-nowrap px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!statementLoaded ? (
                          <tr><td colSpan={7} className="px-4 py-12 text-center fs-text text-muted-foreground">Choose a date range and submit to view this group’s statement.</td></tr>
                        ) : statementRows.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-12 text-center fs-text text-muted-foreground">No transactions found for the selected dates.</td></tr>
                        ) : statementRows.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-card-border last:border-0">
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-strong">{transaction.transactionNo}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-body">{transaction.valueDate}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(transaction.type)}</td>
                            <td className="min-w-[240px] px-4 py-3 text-body">{transaction.narration}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-body">{transaction.drCr === "DR" ? formatTzs(transaction.amountMinor) : "—"}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-body">{transaction.drCr === "CR" ? formatTzs(transaction.amountMinor) : "—"}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-body">{titleCase(transaction.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {statementLoaded ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-4 py-3 fs-text text-muted-foreground">
                      <p>Showing {statementRows.length} of {statementTotal} transactions</p>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={statementLoading || statementPage <= 1} onClick={() => void loadStatement(statementPage - 1, statementAppliedStartDate, statementAppliedEndDate)}>Previous</Button>
                        <span>Page {statementPage} of {statementPageCount}</span>
                        <Button type="button" variant="outline" size="sm" disabled={statementLoading || statementPage >= statementPageCount} onClick={() => void loadStatement(statementPage + 1, statementAppliedStartDate, statementAppliedEndDate)}>Next</Button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
