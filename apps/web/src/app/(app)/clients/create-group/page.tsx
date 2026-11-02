"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Plus, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/ui/search-select";
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
  className?: string;
  children: ReactNode;
};

function Field({ id, label, required = false, className, children }: FieldProps) {
  return (
    <div className={`min-w-0 ${className ?? ""}`}>
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

const COUNTRY_CODES = ["+255", "+254", "+256"];
const REGION_OPTIONS = ["Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "KASKAZINI PEMBA"];
const DISTRICT_OPTIONS = ["Dar es Salaam", "ILALA", "ILALA CBD", "KIGAMBONI", "KINONDONI", "Magomeni"];
const WARD_OPTIONS = ["BUNJU", "HANANASIF", "KAWE", "KIGOGO", "KIJITONYAMA", "KINONDONI"];

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

  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [groupName, setGroupName] = useState("");
  const [countryCode, setCountryCode] = useState("+255");
  const [phone, setPhone] = useState("");
  const [officeNumber, setOfficeNumber] = useState("");
  const [meetingEnabled, setMeetingEnabled] = useState(false);
  const [meetingFrequency, setMeetingFrequency] = useState("");
  const [meetingFrequencies, setMeetingFrequencies] = useState<string[]>([]);

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
  const groupDetailsValid = Boolean(
    region.trim()
    && district.trim()
    && groupName.trim()
    && countryCode.trim()
    && phone.trim()
    && (!meetingEnabled || meetingFrequencies.length > 0),
  );
  const districtOptions = region.toLocaleLowerCase() === "dar es salaam" ? DISTRICT_OPTIONS : [];
  const wardOptions = district.toLocaleLowerCase() === "kinondoni" ? WARD_OPTIONS : [];

  function addMeetingFrequency() {
    const frequency = meetingFrequency.trim();
    if (!frequency) return;
    setMeetingFrequencies((current) => current.includes(frequency) ? current : [...current, frequency]);
    setMeetingFrequency("");
  }

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
        fullName: groupName.trim(),
        clientType: "GROUP",
        branchId,
        membershipPolicyId,
        phone: `${countryCode.trim()} ${phone.trim()}`,
        profile: {
          membership: { branchId, membershipPolicyId, relationshipManagerId: relationshipManagerId || null },
          group: {
            name: groupName.trim(),
          },
          contact: {
            region: region.trim(),
            district: district.trim(),
            ward: ward.trim(),
            countryCode: countryCode.trim(),
            phone: `${countryCode.trim()} ${phone.trim()}`,
            officeNumber: officeNumber.trim(),
          },
          meeting: {
            enabled: meetingEnabled,
            frequency: meetingFrequencies.join(", "),
            frequencies: meetingFrequencies,
          },
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
        className="space-y-4"
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
              value={membershipPolicyId}
              onValueChange={setMembershipPolicyId}
            />
          </Field>
          <Field id="group-branch" label="Branch Name" required>
            <SearchSelect
              id="group-branch"
              options={branches.map((branch) => ({ id: branch.id, label: branch.name }))}
              disabled={loadingOptions}
              value={branchId}
              onValueChange={setBranchId}
            />
          </Field>
          <Field id="group-relationship-manager" label="Relationship Manager">
            <SearchSelect
              id="group-relationship-manager"
              options={managers.map((manager) => ({ id: manager.id, label: manager.fullName }))}
              disabled={loadingOptions}
              value={relationshipManagerId}
              onValueChange={setRelationshipManagerId}
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
          <Field id="group-region" label="Region / State" required className="md:col-span-2">
            <SearchSelect id="group-region" options={REGION_OPTIONS.map((label) => ({ id: label, label }))} value={region} allowCustom placeholder="Select State" onValueChange={(value) => { setRegion(value); setDistrict(""); setWard(""); }} />
          </Field>
          <Field id="group-district" label="District / City" required className="md:col-span-2">
            <SearchSelect id="group-district" options={districtOptions.map((label) => ({ id: label, label }))} value={district} allowCustom placeholder="Select City" onValueChange={(value) => { setDistrict(value); setWard(""); }} />
          </Field>
          <Field id="group-ward" label="Ward">
            <SearchSelect id="group-ward" options={wardOptions.map((label) => ({ id: label, label }))} value={ward} allowCustom placeholder="Enter Ward" onValueChange={setWard} />
          </Field>
          <Field id="group-name" label="Group Name" required>
            <Input id="group-name" value={groupName} onChange={(event) => setGroupName(event.target.value)} required className={INPUT_CLASS} />
          </Field>
          <Field id="group-country-code" label="Country code" required>
            <SearchSelect id="group-country-code" options={COUNTRY_CODES.map((label) => ({ id: label, label }))} value={countryCode} placeholder="Select Country Code" onValueChange={setCountryCode} />
          </Field>
          <Field id="group-phone" label="Phone Number" required>
            <Input id="group-phone" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required className={INPUT_CLASS} />
          </Field>
          <Field id="group-office-number" label="Office Number">
            <Input id="group-office-number" type="tel" value={officeNumber} onChange={(event) => setOfficeNumber(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <div className="col-span-full border-t border-card-border pt-4">
            <label htmlFor="group-meeting-enabled" className="flex items-center gap-2 fs-text font-medium text-body">
              <input id="group-meeting-enabled" type="checkbox" checked={meetingEnabled} onChange={(event) => setMeetingEnabled(event.target.checked)} className="size-4 accent-primary" />
              Group Meeting Date
            </label>
          </div>
          {meetingEnabled ? (
            <>
              <Field id="group-meeting-frequency" label="Frequency" required>
                <SearchSelect id="group-meeting-frequency" options={[]} value={meetingFrequency} allowCustom placeholder="Select Frequency" onValueChange={setMeetingFrequency} />
              </Field>
              <div className="flex items-end">
                <Button type="button" variant="outline" disabled={!meetingFrequency.trim()} onClick={addMeetingFrequency} className="h-[var(--control-height)] gap-2 fs-text">
                  <Plus className="size-4" aria-hidden="true" />
                  Add
                </Button>
              </div>
              {meetingFrequencies.length > 0 ? (
                <ul className="col-span-full flex flex-wrap gap-2" aria-label="Added meeting frequencies">
                  {meetingFrequencies.map((frequency) => (
                    <li key={frequency} className="border border-card-border bg-subtle px-2 py-1 fs-text text-body">{frequency}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}
        </FormSection>

        {error ? <p role="alert" className="fs-text text-accent-red">{error}</p> : null}

        <div className="flex items-center justify-end gap-3 border-t border-card-border pt-4">
          <Button asChild type="button" variant="outline" className="h-[var(--control-height)] fs-text">
            <Link href="/clients">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!groupDetailsUnlocked || !groupDetailsValid || saving} aria-busy={saving} className="h-[var(--control-height)] px-4 fs-text font-semibold">
            {saving ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}
