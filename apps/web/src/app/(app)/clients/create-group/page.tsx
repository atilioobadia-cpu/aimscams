"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import {
  createClient,
  listBranches,
  listLoanOfficers,
  listMembershipPolicies,
  type Branch,
  type LoanOfficer,
  type MembershipPolicy,
} from "@/lib/settings";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
};

function Field({ id, label, required = false, children }: FieldProps) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block fs-text font-medium text-body">
        {label}
        {required ? <span className="ml-0.5 text-accent-red" aria-hidden="true">*</span> : null}
      </label>
      {children}
    </div>
  );
}

type SectionProps = {
  id: string;
  title: string;
  expanded: boolean;
  disabled: boolean;
  onToggle: () => void;
  children: ReactNode;
  onNext?: () => void;
  canContinue?: boolean;
};

function FormSection({ id, title, expanded, disabled, onToggle, children, onNext, canContinue = false }: SectionProps) {
  const contentId = `${id}-content`;

  return (
    <section className="overflow-hidden border border-card-border bg-surface">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        disabled={disabled}
        onClick={onToggle}
        className="flex min-h-[56px] w-full items-center justify-between border-b border-card-border bg-subtle px-5 py-3 text-left fs-text font-semibold text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
      >
        <span>{title}</span>
        {expanded ? <ChevronUp className="size-4 shrink-0" aria-hidden="true" /> : <ChevronDown className="size-4 shrink-0" aria-hidden="true" />}
      </button>
      {expanded ? (
        <div id={contentId} className="grid gap-x-5 gap-y-6 p-5 md:grid-cols-2">
          {children}
          {onNext ? (
            <div className="col-span-full flex justify-end">
              <Button type="button" onClick={onNext} disabled={!canContinue} className="h-[var(--control-height)] px-4 fs-text font-semibold">
                Next
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

const INPUT_CLASS = "h-[var(--control-height)] w-full";

type SearchOption = { id: string; label: string };

function SearchSelect({
  id,
  options,
  disabled,
  onSelect,
}: {
  id: string;
  options: SearchOption[];
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const listId = `${id}-options`;

  return (
    <div className="relative">
      <Input
        id={id}
        list={listId}
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          const match = options.find((option) => option.label.toLocaleLowerCase() === nextQuery.trim().toLocaleLowerCase());
          onSelect(match?.id ?? "");
        }}
        placeholder={disabled ? "Loading..." : "Search..."}
        disabled={disabled}
        autoComplete="off"
        className={`${INPUT_CLASS} pr-8`}
      />
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <datalist id={listId}>
        {options.map((option) => <option key={option.id} value={option.label} />)}
      </datalist>
    </div>
  );
}

export default function CreateGroupPage() {
  const router = useRouter();
  const { pushToast } = useToast();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [policies, setPolicies] = useState<MembershipPolicy[]>([]);
  const [managers, setManagers] = useState<LoanOfficer[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [membershipPolicyId, setMembershipPolicyId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [relationshipManagerId, setRelationshipManagerId] = useState("");
  const [expandedSection, setExpandedSection] = useState<"membership" | "group" | null>("membership");
  const [groupDetailsUnlocked, setGroupDetailsUnlocked] = useState(false);

  const [referenceNo, setReferenceNo] = useState("");
  const [groupName, setGroupName] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [meetingDay, setMeetingDay] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingPlace, setMeetingPlace] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      listBranches().then(({ items }) => items).catch(() => [] as Branch[]),
      listMembershipPolicies({ status: "ACTIVE" }).then(({ items }) => items).catch(() => [] as MembershipPolicy[]),
      listLoanOfficers().then(({ items }) => items).catch(() => [] as LoanOfficer[]),
    ]).then(([branchItems, policyItems, managerItems]) => {
      if (!active) return;
      setBranches(branchItems);
      setPolicies(policyItems);
      setManagers(managerItems);
      setLoadingOptions(false);
    });

    return () => { active = false; };
  }, []);

  const membershipValid = Boolean(membershipPolicyId && branchId);
  const groupDetailsValid = Boolean(groupName.trim());

  function advanceToGroupDetails() {
    if (!membershipValid) return;
    setError(null);
    setGroupDetailsUnlocked(true);
    setExpandedSection("group");
  }

  async function submit() {
    if (!membershipValid || !groupDetailsValid) return;
    setError(null);
    setSaving(true);
    try {
      await createClient({
        referenceNo: referenceNo.trim() ? referenceNo.trim().toUpperCase() : undefined,
        fullName: groupName.trim(),
        clientType: "GROUP",
        branchId,
        membershipPolicyId,
        joinedAt: joiningDate || null,
        profile: {
          membership: { branchId, membershipPolicyId, relationshipManagerId: relationshipManagerId || null },
          group: { name: groupName.trim() },
          meeting: { day: meetingDay, time: meetingTime, place: meetingPlace },
        },
      });
      pushToast("Group created.");
      router.push("/clients");
      router.refresh();
    } catch (failure) {
      setError(message(failure, "Could not create this group."));
    } finally {
      setSaving(false);
    }
  }

  function toggleSection(section: "membership" | "group") {
    if (section === "group" && !groupDetailsUnlocked) return;
    setExpandedSection((current) => current === section ? null : section);
  }

  return (
    <div className="space-y-[18px]">
      <PageHeader
        variant="card"
        icon={<UsersRound className="size-6 shrink-0 text-primary" aria-hidden="true" />}
        title="Create New Group"
        actions={
          <Button asChild variant="ghost" className="gap-2 fs-text font-semibold text-body">
            <Link href="/clients">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Cancel
            </Link>
          </Button>
        }
      />

      <form
        className="space-y-4 rounded-[var(--card-radius)] border border-card-border bg-surface p-4 md:p-5"
        onSubmit={(event) => { event.preventDefault(); void submit(); }}
      >
        <FormSection
          id="membership-details"
          title="Membership Details"
          expanded={expandedSection === "membership"}
          disabled={false}
          onToggle={() => toggleSection("membership")}
          onNext={advanceToGroupDetails}
          canContinue={membershipValid && !loadingOptions}
        >
          <Field id="group-policy" label="Policy" required>
            <SearchSelect
              id="group-policy"
              options={policies.map((policy) => ({ id: policy.id, label: policy.name }))}
              disabled={loadingOptions}
              onSelect={setMembershipPolicyId}
            />
          </Field>
          <Field id="group-branch" label="Branch Name" required>
            <SearchSelect
              id="group-branch"
              options={branches.map((branch) => ({ id: branch.id, label: branch.name }))}
              disabled={loadingOptions}
              onSelect={setBranchId}
            />
          </Field>
          <Field id="group-relationship-manager" label="Relationship Manager">
            <SearchSelect
              id="group-relationship-manager"
              options={managers.map((manager) => ({ id: manager.id, label: manager.fullName }))}
              disabled={loadingOptions}
              onSelect={setRelationshipManagerId}
            />
          </Field>
        </FormSection>

        <FormSection
          id="group-details"
          title="Group Details"
          expanded={expandedSection === "group"}
          disabled={!groupDetailsUnlocked}
          onToggle={() => toggleSection("group")}
        >
          <Field id="group-name" label="Group Name" required>
            <Input id="group-name" value={groupName} onChange={(event) => setGroupName(event.target.value)} required className={INPUT_CLASS} />
          </Field>
          <Field id="group-reference" label="Reference Number">
            <Input id="group-reference" value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} maxLength={20} className={INPUT_CLASS} />
          </Field>
          <Field id="group-joining-date" label="Date Of Joining">
            <Input id="group-joining-date" type="date" value={joiningDate} onChange={(event) => setJoiningDate(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="group-meeting-day" label="Meeting Day">
            <Input id="group-meeting-day" value={meetingDay} onChange={(event) => setMeetingDay(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="group-meeting-time" label="Meeting Time">
            <Input id="group-meeting-time" type="time" value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="group-meeting-place" label="Meeting Place">
            <Input id="group-meeting-place" value={meetingPlace} onChange={(event) => setMeetingPlace(event.target.value)} className={INPUT_CLASS} />
          </Field>
        </FormSection>

        {error ? <p role="alert" className="fs-text text-accent-red">{error}</p> : null}

        <div className="flex items-center justify-end gap-3 border-t border-card-border pt-4">
          <Button asChild type="button" variant="outline" className="h-[var(--control-height)] fs-text">
            <Link href="/clients">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!groupDetailsUnlocked || !groupDetailsValid || saving} aria-busy={saving} className="h-[var(--control-height)] px-4 fs-text font-semibold">
            {saving ? "Saving..." : "Continue"}
            {!saving ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
          </Button>
        </div>
      </form>
    </div>
  );
}
