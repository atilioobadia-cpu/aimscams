"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, UserRoundPlus } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import {
  createClient,
  getNextClientReference,
  listBranches,
  listClients,
  listLoanOfficers,
  listMembershipPolicies,
  type Branch,
  type LoanOfficer,
  type MembershipPolicy,
} from "@/lib/settings";
import { nationalIdPattern } from "@/lib/privacy";

type SectionProps = {
  id: string;
  title: string;
  index: number;
  expanded: boolean;
  disabled: boolean;
  onToggle: () => void;
  onNext: () => void;
  canContinue: boolean;
  children: ReactNode;
};

function FormSection({ id, title, index, expanded, disabled, onToggle, onNext, canContinue, children }: SectionProps) {
  const contentId = id + "-content";

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
        {expanded ? (
          <ChevronUp className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
        )}
      </button>
      {expanded ? (
        <div id={contentId} className="grid gap-x-4 gap-y-5 p-5 md:grid-cols-2">
          {children}
          <div className="col-span-full flex justify-end">
            {index < 5 ? (
              <Button type="button" onClick={onNext} disabled={!canContinue} className="h-[var(--control-height)] px-4 fs-text font-semibold">
                Next
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

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

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

const INPUT_CLASS = "h-[var(--control-height)] w-full";

export default function CreateClientPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [policies, setPolicies] = useState<MembershipPolicy[]>([]);
  const [groups, setGroups] = useState<{ id: string; fullName: string }[]>([]);
  const [managers, setManagers] = useState<LoanOfficer[]>([]);
  const [referenceNo, setReferenceNo] = useState("");
  const [referenceState, setReferenceState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [expandedSection, setExpandedSection] = useState(0);
  const [unlockedSection, setUnlockedSection] = useState(0);

  const [branchId, setBranchId] = useState("");
  const [membershipPolicy, setMembershipPolicy] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [manager, setManager] = useState("");
  const [groupId, setGroupId] = useState("");

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dependents, setDependents] = useState("");
  const [disability, setDisability] = useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");

  const [nationalId, setNationalId] = useState("");
  const [tin, setTin] = useState("");
  const [residence, setResidence] = useState("");

  const [occupation, setOccupation] = useState("");
  const [income, setIncome] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [nextOfKinPercent, setNextOfKinPercent] = useState("100");

  useEffect(() => {
    let active = true;

    void getNextClientReference()
      .then(({ referenceNo: nextReference }) => {
        if (!active) return;
        setReferenceNo(nextReference);
        setReferenceState("ready");
      })
      .catch(() => {
        if (!active) return;
        setReferenceState("unavailable");
      });

    void listBranches()
      .then(({ items }) => {
        if (active) setBranches(items);
      })
      .catch(() => {
        if (active) setBranches([]);
      });

    void listMembershipPolicies({ status: "ACTIVE" })
      .then(({ items }) => {
        if (active) setPolicies(items);
      })
      .catch(() => {
        if (active) setPolicies([]);
      });

    void listClients({ type: "GROUP" })
      .then(({ items }) => {
        if (active) setGroups(items.map(({ id, fullName: name }) => ({ id, fullName: name })));
      })
      .catch(() => {
        if (active) setGroups([]);
      });

    void listLoanOfficers()
      .then(({ items }) => {
        if (active) setManagers(items);
      })
      .catch(() => {
        if (active) setManagers([]);
      });

    return () => {
      active = false;
    };
  }, []);

  function validationFor(index: number): string | null {
    if (index === 0) {
      if (!membershipPolicy) return "Select a membership policy.";
      if (!joiningDate) return "Select a date of joining.";
      if (!branchId) return "Select a branch.";
      if (referenceNo && !/^\d{6}$/.test(referenceNo.trim())) return "Reference number must contain 6 digits.";
    }
    if (index === 1 && !fullName.trim()) return "Full name is required.";
    if (index === 3) {
      if (!nationalId.trim()) return "National ID is required.";
      if (!nationalIdPattern(nationalId)) return "National ID must be in format 19900101-12345-00001-01.";
    }
    if (index === 5) {
      const percent = Number(nextOfKinPercent);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        return "Next of kin percentage must be between 0 and 100.";
      }
    }
    return null;
  }

  function advance(index: number) {
    const validationError = validationFor(index);
    if (validationError) {
      setError(validationError);
      return;
    }

    const nextSection = Math.min(5, index + 1);
    setError(null);
    setUnlockedSection((current) => Math.max(current, nextSection));
    setExpandedSection(nextSection);
  }

  function toggleSection(index: number) {
    if (index > unlockedSection) return;
    setError(null);
    setExpandedSection((current) => current === index ? -1 : index);
  }

  function openFirstInvalidSection(): boolean {
    for (let index = 0; index < 6; index += 1) {
      const validationError = validationFor(index);
      if (validationError) {
        setError(validationError);
        setUnlockedSection((current) => Math.max(current, index));
        setExpandedSection(index);
        return false;
      }
    }
    return true;
  }

  async function submit() {
    if (!openFirstInvalidSection()) return;

    setError(null);
    setSaving(true);
    try {
      await createClient({
        referenceNo: referenceNo.trim() || undefined,
        fullName: fullName.trim(),
        clientType: "INDIVIDUAL",
        phone: phone.trim() || null,
        email: email.trim() || null,
        nationalId: nationalId.trim() || null,
        branchId: branchId || null,
        membershipPolicyId: membershipPolicy || null,
        groupId: groupId || null,
        joinedAt: joiningDate || null,
        profile: {
          membership: { branchId, membershipPolicy, joiningDate, manager, groupId },
          personal: { gender, dateOfBirth, dependents, disability },
          contact: { address, region, district, ward },
          identity: { nationalId, tin },
          residence,
          employment: { occupation, income },
          nextOfKin: { name: nextOfKinName, phone: nextOfKinPhone, percentage: Number(nextOfKinPercent) },
        },
      });
      pushToast("Client created.");
      router.push("/clients");
      router.refresh();
    } catch (failure) {
      setError(message(failure, "Could not create this client."));
    } finally {
      setSaving(false);
    }
  }

  const membershipValid = Boolean(membershipPolicy && joiningDate && branchId && (!referenceNo || /^\d{6}$/.test(referenceNo.trim())));
  const personalValid = Boolean(fullName.trim());
  const identityValid = Boolean(nationalId.trim() && nationalIdPattern(nationalId));
  const nextOfKinValid = Number.isFinite(Number(nextOfKinPercent)) && Number(nextOfKinPercent) >= 0 && Number(nextOfKinPercent) <= 100;
  const requiredStepsValid = membershipValid && personalValid && identityValid && nextOfKinValid;

  return (
    <div className="space-y-[18px]">
      <PageHeader
        variant="card"
        icon={<UserRoundPlus className="size-6 shrink-0 text-primary" aria-hidden="true" />}
        title="Create New Client"
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
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <FormSection
          id="membership-details"
          title="Membership Details"
          index={0}
          expanded={expandedSection === 0}
          disabled={false}
          onToggle={() => toggleSection(0)}
          onNext={() => advance(0)}
          canContinue={membershipValid}
        >
          <Field id="client-policy" label="Policy" required>
            <select
              id="client-policy"
              value={membershipPolicy}
              onChange={(event) => setMembershipPolicy(event.target.value)}
              required
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"
            >
              <option value="">Search...</option>
              {policies.map((policy) => (
                <option key={policy.id} value={policy.id}>{policy.name}</option>
              ))}
            </select>
          </Field>
          <Field id="client-joining-date" label="Date Of Joining" required>
            <Input id="client-joining-date" type="date" value={joiningDate} onChange={(event) => setJoiningDate(event.target.value)} required className={INPUT_CLASS} />
          </Field>
          <Field id="client-reference" label="Reference Number">
            <Input
              id="client-reference"
              value={referenceNo}
              onChange={(event) => setReferenceNo(event.target.value)}
              placeholder={referenceState === "loading" ? "Generating..." : referenceState === "unavailable" ? "Assigned on save" : ""}
              inputMode="numeric"
              maxLength={6}
              aria-describedby="client-reference-help"
              className={INPUT_CLASS}
            />
            <p id="client-reference-help" className="mt-1 fs-text text-muted-foreground">
              {referenceState === "unavailable" ? "Generated automatically when saved." : "Generated automatically; enter six digits to change it."}
            </p>
          </Field>
          <Field id="client-branch" label="Branch Name" required>
            <select
              id="client-branch"
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              required
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"
            >
              <option value="">Search...</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </Field>
          <Field id="client-manager" label="Client Manager">
            <Input
              id="client-manager"
              list="client-manager-options"
              value={manager}
              onChange={(event) => setManager(event.target.value)}
              placeholder="Search..."
              className={INPUT_CLASS}
            />
            <datalist id="client-manager-options">
              {managers.map((item) => <option key={item.id} value={item.fullName} />)}
            </datalist>
          </Field>
          <Field id="client-group" label="Group Name">
            <select
              id="client-group"
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"
            >
              <option value="">Search...</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.fullName}</option>)}
            </select>
          </Field>
        </FormSection>

        <FormSection
          id="personal-details"
          title="Personal Details"
          index={1}
          expanded={expandedSection === 1}
          disabled={unlockedSection < 1}
          onToggle={() => toggleSection(1)}
          onNext={() => advance(1)}
          canContinue={personalValid}
        >
          <Field id="client-full-name" label="Full Name" required>
            <Input id="client-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required className={INPUT_CLASS} />
          </Field>
          <Field id="client-gender" label="Gender">
            <Input id="client-gender" value={gender} onChange={(event) => setGender(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-dob" label="Date Of Birth">
            <Input id="client-dob" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-dependents" label="Number Of Dependents">
            <Input id="client-dependents" value={dependents} onChange={(event) => setDependents(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-disability" label="Person With Disability">
            <Input id="client-disability" value={disability} onChange={(event) => setDisability(event.target.value)} className={INPUT_CLASS} />
          </Field>
        </FormSection>

        <FormSection
          id="contact-details"
          title="Contact Details"
          index={2}
          expanded={expandedSection === 2}
          disabled={unlockedSection < 2}
          onToggle={() => toggleSection(2)}
          onNext={() => advance(2)}
          canContinue={true}
        >
          <Field id="client-phone" label="Phone Number">
            <Input id="client-phone" value={phone} onChange={(event) => setPhone(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-email" label="Email Address">
            <Input id="client-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-address" label="Address">
            <Input id="client-address" value={address} onChange={(event) => setAddress(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-region" label="Region">
            <Input id="client-region" value={region} onChange={(event) => setRegion(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-district" label="District">
            <Input id="client-district" value={district} onChange={(event) => setDistrict(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-ward" label="Ward">
            <Input id="client-ward" value={ward} onChange={(event) => setWard(event.target.value)} className={INPUT_CLASS} />
          </Field>
        </FormSection>

        <FormSection
          id="identity-number"
          title="Identity Number"
          index={3}
          expanded={expandedSection === 3}
          disabled={unlockedSection < 3}
          onToggle={() => toggleSection(3)}
          onNext={() => advance(3)}
          canContinue={identityValid}
        >
          <Field id="client-national-id" label="National ID" required>
            <Input id="client-national-id" value={nationalId} onChange={(event) => setNationalId(event.target.value)} required className={INPUT_CLASS} />
          </Field>
          <Field id="client-tin" label="TIN">
            <Input id="client-tin" value={tin} onChange={(event) => setTin(event.target.value)} className={INPUT_CLASS} />
          </Field>
        </FormSection>

        <FormSection
          id="residence"
          title="Residence"
          index={4}
          expanded={expandedSection === 4}
          disabled={unlockedSection < 4}
          onToggle={() => toggleSection(4)}
          onNext={() => advance(4)}
          canContinue={true}
        >
          <Field id="client-residence" label="Residence">
            <Input id="client-residence" value={residence} onChange={(event) => setResidence(event.target.value)} className={INPUT_CLASS} />
          </Field>
        </FormSection>

        <FormSection
          id="employment"
          title="Employment"
          index={5}
          expanded={expandedSection === 5}
          disabled={unlockedSection < 5}
          onToggle={() => toggleSection(5)}
          onNext={() => advance(5)}
          canContinue={nextOfKinValid}
        >
          <Field id="client-occupation" label="Occupation">
            <Input id="client-occupation" value={occupation} onChange={(event) => setOccupation(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-income" label="Income">
            <Input id="client-income" value={income} onChange={(event) => setIncome(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <div className="col-span-full border-t border-card-border pt-4">
            <h2 className="fs-text font-semibold text-body">Next of kin</h2>
          </div>
          <Field id="client-nok-name" label="Next of kin name">
            <Input id="client-nok-name" value={nextOfKinName} onChange={(event) => setNextOfKinName(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-nok-phone" label="Next of kin phone">
            <Input id="client-nok-phone" value={nextOfKinPhone} onChange={(event) => setNextOfKinPhone(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-nok-percent" label="Next of kin percentage">
            <Input id="client-nok-percent" type="number" min={0} max={100} value={nextOfKinPercent} onChange={(event) => setNextOfKinPercent(event.target.value)} className={INPUT_CLASS} />
          </Field>
        </FormSection>

        {error ? <p role="alert" className="fs-text text-accent-red">{error}</p> : null}

        <div className="flex items-center justify-end gap-3 border-t border-card-border pt-4">
          <Button asChild type="button" variant="outline" disabled={saving}>
            <Link href="/clients">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving || !requiredStepsValid} aria-busy={saving} className="h-[var(--control-height)] px-4 fs-text font-semibold">
            {saving ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}

