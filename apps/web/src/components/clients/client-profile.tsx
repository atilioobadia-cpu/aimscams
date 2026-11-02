"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Edit2,
  FileText,
  Inbox,
  Landmark,
  LogOut,
  PiggyBank,
  Plus,
  Repeat,
  Send,
  ShieldCheck,
  UserRound,
  UserX,
  Wallet,
  X,
} from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api";
import { getClient, listLoans, listSavingsAccounts, type Client, type Loan, type SavingsAccount } from "@/lib/settings";
import { maskEmail, titleCase } from "@/lib/privacy";
import { cn } from "cn";

const profileTabs = [
  { label: "Summary", value: "summary" },
  { label: "Users", value: "users" },
  { label: "Accounts", value: "accounts" },
  { label: "Charges", value: "charges" },
  { label: "Residence", value: "residence" },
  { label: "KYC", value: "kyc" },
  { label: "Income", value: "income" },
  { label: "Assets", value: "assets" },
  { label: "Bank", value: "bank" },
  { label: "Verification History", value: "verification-history" },
  { label: "Statement", value: "statement" },
  { label: "History", value: "history" },
] as const;

function profileTabFromParam(value: string | null): string {
  if (!value) return "summary";
  const index = Number(value);
  return Number.isInteger(index) && index > 0 && index < profileTabs.length
    ? profileTabs[index].value
    : "summary";
}

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return "N/A";
}

function SectionCard({ title, icon: Icon, children, editHref }: { title: string; icon: typeof Building2; children: React.ReactNode; editHref?: string }) {
  return (
    <section className="border-t border-[#e2e6f0] px-[13.44px] py-[13.44px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-primary" aria-hidden="true" />
          <h3 className="text-[15.12px] font-semibold leading-tight text-[#495057]">{title}</h3>
        </div>
        {editHref ? <Link href={editHref} aria-label={"Edit " + title} className="grid h-[31px] w-[37px] place-items-center rounded-[5px] border border-primary text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><Edit2 className="size-4" aria-hidden="true" /></Link> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-[2px] py-[6px]">
      <dt className="text-[13.44px] font-normal leading-[1.4] text-muted-foreground">{label}</dt>
      <dd className="break-words text-[13.44px] font-normal leading-[1.4] text-[#495057]">{value}</dd>
    </div>
  );
}
function EmptyTable({ columns, message: emptyMessage, icon: Icon = Building2 }: { columns: string[]; message: string; icon?: typeof Building2 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-[13.44px]">
        <thead className="bg-[#f8fafc]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-[10.08px] py-[10.08px] text-[13.44px] font-bold text-[#495057]">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="px-4 py-10 text-center">
              <Icon className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden="true" />
              <p className="fs-text text-muted-foreground">{emptyMessage}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TabTable({ columns, rows, emptyMessage }: { columns: string[]; rows: string[][]; emptyMessage: string }) {
  return (
    <div className="overflow-x-auto rounded-[6.72px] border border-card-border bg-surface">
      <table className="w-full min-w-[720px] text-left text-[13.44px]">
        <thead className="bg-[#f8fafc]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-[10.08px] py-[10.08px] text-[13.44px] font-bold text-[#495057]">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center">
                <Inbox className="mx-auto mb-2 size-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-[13.44px] text-muted-foreground">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-card-border">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="whitespace-nowrap px-[10.08px] py-[10.08px] text-[#495057]">{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ClientProfile({ id }: { id: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabListRef = useRef<HTMLDivElement>(null);
  const [tabOverflow, setTabOverflow] = useState({ needed: false, atEnd: false });
  const activeTab = profileTabFromParam(searchParams.get("tab"));
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [savings, setSavings] = useState<SavingsAccount[]>([]);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [statementStart, setStatementStart] = useState("");
  const [statementEnd, setStatementEnd] = useState("");

  useEffect(() => {
    let active = true;
    void getClient(id)
      .then((response) => {
        if (!active) return;
        setClient(response.client);
        setCanEdit(response.canEdit);
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

  useEffect(() => {
    if (!client) return;
    let active = true;
    void listLoans({})
      .then((response) => {
        if (!active) return;
        setLoans(response.items.filter((loan) => loan.clientReference === client.referenceNo));
      })
      .catch(() => {
        if (!active) return;
        setLoans([]);
      });
    void listSavingsAccounts()
      .then((response) => {
        if (!active) return;
        setSavings(response.items.filter((account) => account.clientReference === client.referenceNo));
      })
      .catch(() => {
        if (!active) return;
        setSavings([]);
      });
    return () => {
      active = false;
    };
  }, [client]);

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
  const personal = objectValue(profile.personal);
  const identity = objectValue(profile.identity);
  const contact = objectValue(profile.contact);
  const residenceDetails = objectValue(profile.residenceDetails);
  const currentResidence = stringValue(residenceDetails.currentAddress) || stringValue(profile.residence);
  const lastResidence = stringValue(residenceDetails.lastAddress);
  const sameAsCurrentResidence = residenceDetails.sameAsCurrent === true;
  const initials = client?.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "NA";
  const editHref = canEdit && client ? `/clients/${encodeURIComponent(client.id)}/edit` : undefined;

  useEffect(() => {
    const tabList = tabListRef.current;
    if (!tabList) return;

    const updateOverflow = () => {
      const needed = tabList.scrollWidth > tabList.clientWidth + 1;
      const atEnd = tabList.scrollLeft + tabList.clientWidth >= tabList.scrollWidth - 1;
      setTabOverflow((current) => current.needed === needed && current.atEnd === atEnd
        ? current
        : { needed, atEnd });
    };

    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(tabList);
    window.addEventListener("resize", updateOverflow);
    tabList.addEventListener("scroll", updateOverflow, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOverflow);
      tabList.removeEventListener("scroll", updateOverflow);
    };
  }, []);

  useEffect(() => {
    tabListRef.current
      ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [activeTab]);

  function selectProfileTab(value: string) {
    const index = profileTabs.findIndex((tab) => tab.value === value);
    if (index < 0) return;
    const nextParams = new URLSearchParams(searchParams.toString());
    if (index === 0) nextParams.delete("tab");
    else nextParams.set("tab", String(index));
    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-5 text-[13.44px] text-[#495057]">
      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={10} />
        </section>
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => window.location.reload()} />
      ) : client ? (
        <>
          <section className="flex min-h-[108px] flex-wrap items-center gap-x-6 gap-y-4 rounded-[8px] border border-[#dee2e6] bg-white px-[16px] py-[12px]">
            <div className="flex min-w-[340px] flex-1 items-center gap-[16px]">
              <div className="flex size-[80px] shrink-0 items-center justify-center rounded-full border-[3px] border-primary bg-[#e9ecef] text-[25px] font-normal text-[#6c757d]" aria-hidden="true">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[18px] font-bold leading-[1.25] text-[#212529]">{client.fullName.toUpperCase()}</h1>
                <p className="mt-[4px] text-[13.44px] leading-[1.4] text-[#495057]">Member ID: {client.memberNo ?? client.referenceNo}</p>
              </div>
            </div>
            <div className="grid min-w-[520px] flex-[1.2] grid-cols-2 gap-x-[24px] gap-y-[8px] lg:grid-cols-4">
              {[
                ["Status", titleCase(client.status)],
                ["KYC Status", titleCase(client.kycStatus)],
                ["Phone Number", client.phone || "N/A"],
                ["Type", titleCase(client.clientType)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <p className="text-[13.44px] leading-[1.35] text-[#6c757d]">{label}</p>
                  <p className="truncate text-[13.44px] leading-[1.45] text-[#212529]">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <Tabs value={activeTab} onValueChange={selectProfileTab} className="gap-0">
            <div className={cn(
              "flex h-[44.9px] w-full items-stretch border-[#dee2e6] bg-white",
              activeTab === "summary" ? "rounded-t-[8px] border-x border-t" : "rounded-[8px] border",
            )}>
              <TabsList ref={tabListRef} id="client-profile-tabs" variant="line" className="h-full min-w-0 flex-1 justify-start overflow-x-auto rounded-none border-0 bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {profileTabs.map(({ label: tab, value }) => (
                <TabsTrigger
                  key={tab}
                  value={value}
                  className="h-full flex-none rounded-none border-0 px-[16px] py-0 text-[13.44px] font-medium text-[#6c757d] after:bottom-0 after:h-[2px] after:bg-primary data-[state=active]:font-semibold data-[state=active]:text-primary"
                >
                  {tab}
                </TabsTrigger>
              ))}
              </TabsList>
              {tabOverflow.needed ? (
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={tabOverflow.atEnd ? "Show earlier client tabs" : "Show more client tabs"}
                  aria-controls="client-profile-tabs"
                  onClick={() => {
                    const tabList = tabListRef.current;
                    if (!tabList) return;
                    tabList.scrollTo({
                      left: tabOverflow.atEnd ? 0 : tabList.scrollLeft + tabList.clientWidth * 0.8,
                      behavior: "smooth",
                    });
                  }}
                  className="h-full w-[42px] flex-none rounded-none border-0 border-l border-[#f1f3f5] p-0 text-[#6c757d] hover:bg-[#f8fafc] hover:text-primary"
                >
                  {tabOverflow.atEnd ? <ChevronLeft className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
                </Button>
              ) : null}
            </div>

            <TabsContent value="summary" className="mt-0 space-y-[12px]">
              <div className="flex min-h-[54px] flex-wrap items-center justify-end gap-[8px] rounded-b-[8px] border-x border-b border-[#dee2e6] bg-white px-[16px] py-[8px]">
                {[
                  { label: "Transaction", icon: ArrowLeftRight, href: "/transactions" },
                  { label: "Send USSD PIN OTP", icon: Send },
                  { label: "Deactivate", icon: UserX },
                  { label: "Exit", icon: LogOut },
                ].map(({ label, icon: Icon, href }) => {
                  const className = "h-[34px] rounded-[6px] border-primary px-[12px] text-[13.44px] font-medium text-primary hover:bg-primary-tint disabled:opacity-100 disabled:text-primary";
                  const content = <><Icon className="mr-[6px] size-[14px]" aria-hidden="true" />{label}</>;
                  return href ? (
                    <Button key={label} asChild variant="outline" className={className}>
                      <Link href={href}>{content}</Link>
                    </Button>
                  ) : (
                    <Button key={label} variant="outline" disabled className={className}>{content}</Button>
                  );
                })}
              </div>

              <div className="overflow-hidden rounded-[10.08px] border border-[#dee2e6] bg-white">
                <div className="grid grid-cols-1 gap-[13.44px] p-[13.44px] lg:grid-cols-[234px_minmax(0,1fr)]">
                  <section className="rounded-[6.72px] border border-[#dee2e6] p-[13.44px]">
                    <div className="mb-[12px] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserRound className="size-5 text-primary" aria-hidden="true" />
                        <h3 className="text-[15.12px] font-semibold text-[#495057]">Profile</h3>
                      </div>
                      {editHref ? <Link href={editHref} aria-label="Edit profile" className="grid h-[31px] w-[37px] place-items-center rounded-[5px] border border-primary text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><Edit2 className="size-4" aria-hidden="true" /></Link> : null}
                    </div>
                    <div className="flex flex-col items-center gap-[8px] text-center">
                      <div className="flex size-[120px] items-center justify-center rounded-full border-[2px] border-[#dee2e6] bg-[#e9ecef] text-[28px] font-normal text-[#6c757d]" aria-hidden="true">
                        {initials}
                      </div>
                      <h3 className="text-[13.44px] font-semibold leading-[1.35] text-[#495057]">{client.fullName.toUpperCase()}</h3>
                      <p className="text-[13.44px] text-muted-foreground">Member</p>
                      <a href="#" className="rounded-[5px] bg-[#e9ecef] px-[18px] py-[8px] text-[13.44px] font-medium text-[#495057]">Signature</a>
                    </div>
                  </section>

                  <section className="rounded-[6.72px] border border-[#dee2e6] p-[13.44px]">
                    <div className="mb-[10px] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserRound className="size-5 text-primary" aria-hidden="true" />
                        <h3 className="text-[15.12px] font-semibold text-[#495057]">Membership Details</h3>
                      </div>
                      {editHref ? <Link href={editHref} aria-label="Edit membership details" className="grid h-[31px] w-[37px] place-items-center rounded-[5px] border border-primary text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><Edit2 className="size-4" aria-hidden="true" /></Link> : null}
                    </div>
                    <dl className="grid grid-cols-1 gap-x-[16px] md:grid-cols-2 xl:grid-cols-3">
                      <Field label="Member Id" value={client.memberNo ?? client.referenceNo} />
                      <Field label="Client Manager" value="N/A" />
                      <Field label="Type" value={titleCase(client.clientType)} />
                      <Field label="Reference Number" value={client.referenceNo || "N/A"} />
                      <Field label="Branch Name" value={client.branchName ?? "N/A"} />
                      <Field label="Policy" value="N/A" />
                      <Field label="Quick Loan Credit Limit" value="N/A" />
                      <Field label="Restricted from Quick Loan" value="N/A" />
                      <Field label="Date Of Joining" value={client.joinedAt ? new Date(client.joinedAt).toLocaleDateString() : "N/A"} />
                      <Field label="Group Name" value={client.groupName ?? "N/A"} />
                    </dl>
                  </section>
                </div>

                <SectionCard title="Contact Information" icon={Building2} editHref={editHref}>
                  <dl className="grid grid-cols-1 gap-x-[18px] md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Email Address" value={maskEmail(client.email) || "N/A"} />
                    <Field label="Phone Number" value={client.phone || "N/A"} />
                    <Field label="Physical Location" value={currentResidence || "N/A"} />
                    <Field label="MNO" value={stringValue(contact.mno) || "N/A"} />
                  </dl>
                </SectionCard>

                <SectionCard title="Personal Details" icon={UserRound} editHref={editHref}>
                  <dl className="grid grid-cols-1 gap-x-[18px] md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Full Name" value={client.fullName.toUpperCase()} />
                    <Field label="Gender" value={titleCase(stringValue(personal.gender) || "N/A")} />
                    <Field label="Age" value={numberValue(personal.age)} />
                    <Field label="Nationality" value={stringValue(personal.nationality) || "N/A"} />
                    <Field label="Date Of Birth" value={stringValue(personal.dateOfBirth) ? new Date(stringValue(personal.dateOfBirth)).toLocaleDateString() : "N/A"} />
                    <Field label="Marital Status" value={titleCase(stringValue(personal.maritalStatus) || "N/A")} />
                    <Field label="Father's Name" value={stringValue(personal.fatherName) || "N/A"} />
                    <Field label="Spouse's Name" value={stringValue(personal.spouseName) || "N/A"} />
                  </dl>
                </SectionCard>

                <SectionCard title="Identity Number" icon={ShieldCheck} editHref={editHref}>
                  <dl className="grid grid-cols-1 gap-x-[18px] md:grid-cols-2">
                    <Field label="National ID Number" value={client.nationalId || "N/A"} />
                    <Field label="Tax Number" value={stringValue(identity.tin) || "N/A"} />
                  </dl>
                </SectionCard>

                <SectionCard title="Socio-Economic Data" icon={Building2} editHref={editHref}>
                  <dl className="grid grid-cols-1 gap-x-[18px] md:grid-cols-2">
                    <Field label="Person with disability (PWD)" value={titleCase(stringValue(personal.disability) || "N/A")} />
                    <Field label="Number Of Dependents" value={numberValue(personal.dependents)} />
                  </dl>
                </SectionCard>

                <SectionCard title="Standing Instructions" icon={Repeat} editHref={editHref}>
                  <EmptyTable columns={["Rule", "Product/Charge Name", "Source Product", "Source Account", "Status", "Actions"]} message="No data available" icon={Repeat} />
                </SectionCard>

                <SectionCard title="Next of Kin" icon={UserRound} editHref={editHref}>
                  <EmptyState icon={UserRound} title="No next of kin records found" description="No local next of kin records are available." />
                </SectionCard>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <TabTable columns={["Full Name", "Email Address", "Country code", "Phone Number", "Role", "Actions"]} rows={[]} emptyMessage="No local users available." />
            </TabsContent>

            <TabsContent value="accounts">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-[13.44px] text-[#495057]">
                    <input type="checkbox" checked={showAllAccounts} onChange={(event) => setShowAllAccounts(event.target.checked)} />
                    Show All
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">New loan application</Button>
                    <Button variant="outline" className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">Add saving</Button>
                    <Button variant="outline" className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">Add share</Button>
                  </div>
                </div>

                {[
                  { title: "Loans", items: loans },
                  { title: "Savings", items: savings },
                  { title: "Shares", items: [] as SavingsAccount[] },
                ].map((section) => (
                  <details key={section.title} open className="rounded-[6.72px] border border-[#e2e6f0] bg-surface p-[13.44px]">
                    <summary className="flex cursor-pointer list-none items-center justify-between">
                      <span className="flex items-center gap-2 text-[15.12px] font-semibold text-[#495057]">
                        {section.title}
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-tint px-1 text-[11.76px] font-semibold text-primary">{section.items.length}</span>
                      </span>
                      <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                    </summary>
                    <div className="mt-3 space-y-2">
                      {section.items.length === 0 ? (
                        <p className="text-[13.44px] text-muted-foreground">No local accounts available.</p>
                      ) : (
                        section.items.map((item) => (
                          <div key={item.id} className="rounded-[6.72px] border border-[#e2e6f0] p-[10.08px]">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-[13.44px] font-semibold text-[#495057]">
                                  {"loanNumber" in item ? item.loanNumber : item.accountNumber}{" "}
                                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11.76px] font-semibold text-green-700">
                                    {titleCase(item.status)}
                                  </span>
                                </p>
                                <p className="text-[13.44px] text-muted-foreground">
                                  {item.productName} • Amount: {"principalMinor" in item ? item.principalMinor : item.balanceMinor} • Tenure: {"tenureCount" in item ? `${item.tenureCount} ${item.tenurePeriod}` : "N/A"}
                                </p>
                                <p className="text-[13.44px] text-muted-foreground">
                                  Interest: {"interestRateBp" in item ? `${(item.interestRateBp / 100).toFixed(2)}% per Month` : "N/A"}
                                </p>
                              </div>
                              <Button variant="outline" className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">View Balance</Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="charges">
              <div className="mb-3 flex justify-end">
                <Button variant="outline" className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">Add Charge</Button>
              </div>
              <TabTable columns={["Charges Type", "Creation Date", "Due Date", "Outstanding Days", "Amount (TSh)", "Outstanding Amount (TSh)", "Status", "Actions"]} rows={[]} emptyMessage="No data available" />
            </TabsContent>

            <TabsContent value="residence">
              <div className="mb-3 flex justify-end">
                <Button variant="outline" className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">Add Residence</Button>
              </div>
              <TabTable columns={["House Number", "Address Line 1", "Address Line 2", "Address Line 3", "Area / Ward", "District / City", "Region / State", "Country", "Pincode / Zip", "Actions"]} rows={currentResidence ? [[currentResidence, "", "", "", "", "", "", "", "", ""]] : []} emptyMessage="No data available" />
            </TabsContent>

            <TabsContent value="kyc">
              <div className="mb-3 flex gap-2">
                <Button variant="outline" className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">Add KYC</Button>
                <Button variant="outline" className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">Unapprove KYC</Button>
              </div>
              <TabTable columns={["Document", "Uploaded Date", "Comments", "Document Name", "Actions"]} rows={[]} emptyMessage="No data available" />
            </TabsContent>

            <TabsContent value="income">
              <div className="mb-3 flex justify-end">
                <Button variant="outline" className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">Add Income</Button>
              </div>
              <TabTable columns={["Company Name", "Company Address", "Monthly Income", "Contract Type", "Business Address", "Business Registration Number(Brela)", "Business License Number", "TIN Number", "Business Turn Over(weekly,yearly)", "Actions"]} rows={[]} emptyMessage="No data available" />
            </TabsContent>

            <TabsContent value="assets">
              <div className="mb-3 flex justify-end">
                <Button variant="outline" className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">Add Asset</Button>
              </div>
              <TabTable columns={["Type", "Value", "Location", "Comments / Notes", "Actions"]} rows={[]} emptyMessage="No data available" />
            </TabsContent>

            <TabsContent value="bank">
              <div className="mb-3 flex justify-end">
                <Button variant="outline" className="h-[30px] rounded-[6px] border-primary px-3 text-[11.76px] font-medium text-primary hover:bg-primary-tint">Add Bank</Button>
              </div>
              <TabTable columns={["Bank Name", "Account Number", "BIC/Swift Code", "Branch Address", "Actions"]} rows={[]} emptyMessage="No data available" />
            </TabsContent>

            <TabsContent value="verification-history">
              <TabTable columns={["Date and Time", "Verification Type", "Verification Status", "Verification Identifier", "Performed By", "Reference ID / Source", "Error", "Actions"]} rows={[]} emptyMessage="No data available" />
            </TabsContent>

            <TabsContent value="statement">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-[13.44px] text-muted-foreground">Start Date</label>
                  <Input type="date" value={statementStart} onChange={(event) => setStatementStart(event.target.value)} className="h-[var(--control-height)] w-[180px]" />
                </div>
                <div>
                  <label className="mb-1 block text-[13.44px] text-muted-foreground">End Date</label>
                  <Input type="date" value={statementEnd} onChange={(event) => setStatementEnd(event.target.value)} className="h-[var(--control-height)] w-[180px]" />
                </div>
                <Button className="h-[var(--control-height)] px-5 text-[11.76px] font-medium">Submit</Button>
                <Button variant="outline" disabled className="h-[var(--control-height)] px-5 text-[11.76px] font-medium">Print</Button>
                <Button variant="outline" disabled className="h-[var(--control-height)] px-5 text-[11.76px] font-medium">Download</Button>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[6.72px] border border-card-border bg-surface px-4 py-8 text-center">
                <div className="grid size-10 place-items-center rounded-full bg-primary-tint text-primary">
                  <FileText className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-[15.12px] font-semibold text-[#495057]">History</h2>
                  <p className="mt-1 text-[13.44px] text-muted-foreground">No history records found.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
