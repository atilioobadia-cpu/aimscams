"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, UserRoundPlus } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSelect } from "@/components/ui/search-select";
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
const COUNTRY_CODES = ["+255", "+254", "+256"];
const MNO_OPTIONS = ["MPESA", "TIGOPESA", "HALOPESA", "AIRTEL MONEY", "TTCL PESA", "EASY PESA", "MTN", "AFRIMONEY"];
const NATIONALITIES = ["Uganda", "Kenya", "Tanzania"];
const GENDERS = ["Male", "Female", "Other"];
const MARITAL_STATUSES = ["Divorced", "Married", "Separated", "Single", "Widowed"];

function calculateAge(dateOfBirth: string): string {
  if (!dateOfBirth) return "";
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday = today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? String(age) : "";
}

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

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [nationality, setNationality] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [dependents, setDependents] = useState("");
  const [disability, setDisability] = useState(false);

  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+255");
  const [mno, setMno] = useState("");
  const [email, setEmail] = useState("");

  const [nationalId, setNationalId] = useState("");
  const [tin, setTin] = useState("");
  const [currentResidence, setCurrentResidence] = useState("");
  const [lastResidence, setLastResidence] = useState("");
  const [sameResidence, setSameResidence] = useState(false);

  const [currentEmployment, setCurrentEmployment] = useState("");
  const [lastEmployment, setLastEmployment] = useState("");
  const [sameEmployment, setSameEmployment] = useState(false);

  const fullName = [firstName, middleName, lastName].map((part) => part.trim()).filter(Boolean).join(" ");

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
    if (index === 2 && !phone.trim()) return "Phone number is required.";
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
        nationalId: nationalId.trim() || null,
        branchId: branchId || null,
        membershipPolicyId: membershipPolicy || null,
        groupId: groupId || null,
        joinedAt: joiningDate || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        profile: {
          membership: { branchId, membershipPolicy, joiningDate, manager, groupId },
          personal: {
            firstName: firstName.trim(),
            middleName: middleName.trim(),
            lastName: lastName.trim(),
            gender,
            dateOfBirth,
            age: calculateAge(dateOfBirth),
            maritalStatus,
            nationality,
            fatherName: fatherName.trim(),
            spouseName: spouseName.trim(),
            dependents: dependents === "" ? null : Number(dependents),
            disability,
          },
          contact: {
            countryCode,
            phone: phone.trim(),
            mno,
            email: email.trim(),
          },
          identity: { nationalId, tin },
          residence: currentResidence,
          residenceDetails: {
            currentAddress: currentResidence.trim(),
            lastAddress: (sameResidence ? currentResidence : lastResidence).trim(),
            sameAsCurrent: sameResidence,
          },
          employment: {
            currentPlace: currentEmployment.trim(),
            lastPlace: (sameEmployment ? currentEmployment : lastEmployment).trim(),
            sameAsCurrent: sameEmployment,
          },
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
  const personalValid = Boolean(firstName.trim() && lastName.trim());
  const contactValid = Boolean(phone.trim());
  const identityValid = true;
  const requiredStepsValid = membershipValid && personalValid && contactValid && identityValid;

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
        className="space-y-4"
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
            <SearchSelect
              id="client-policy"
              options={policies.map((policy) => ({ id: policy.id, label: policy.name }))}
              value={membershipPolicy}
              placeholder="Search..."
              onValueChange={setMembershipPolicy}
            />
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
            <SearchSelect
              id="client-branch"
              options={branches.map((branch) => ({ id: branch.id, label: branch.name }))}
              value={branchId}
              placeholder="Search..."
              onValueChange={setBranchId}
            />
          </Field>
          <Field id="client-manager" label="Client Manager">
            <SearchSelect
              id="client-manager"
              options={managers.map((item) => ({ id: item.fullName, label: item.fullName }))}
              value={manager}
              placeholder="Search..."
              onValueChange={setManager}
            />
          </Field>
          <Field id="client-group" label="Group Name">
            <SearchSelect
              id="client-group"
              options={groups.map((group) => ({ id: group.id, label: group.fullName }))}
              value={groupId}
              placeholder="Search..."
              onValueChange={setGroupId}
            />
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
          <Field id="client-first-name" label="First Name" required>
            <Input id="client-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required className={INPUT_CLASS} />
          </Field>
          <Field id="client-middle-name" label="Middle Name">
            <Input id="client-middle-name" value={middleName} onChange={(event) => setMiddleName(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-last-name" label="Last Name" required>
            <Input id="client-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required className={INPUT_CLASS} />
          </Field>
          <Field id="client-dob" label="Date Of Birth">
            <Input id="client-dob" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-age" label="Age">
            <Input id="client-age" value={calculateAge(dateOfBirth)} readOnly className={`${INPUT_CLASS} bg-muted`} />
          </Field>
          <Field id="client-gender" label="Gender">
            <SearchSelect id="client-gender" options={GENDERS.map((item) => ({ id: item, label: item }))} value={gender} placeholder="Select Gender" onValueChange={setGender} />
          </Field>
          <Field id="client-marital-status" label="Marital Status">
            <SearchSelect id="client-marital-status" options={MARITAL_STATUSES.map((item) => ({ id: item, label: item }))} value={maritalStatus} placeholder="Select Marital Status" onValueChange={setMaritalStatus} />
          </Field>
          <Field id="client-nationality" label="Nationality">
            <SearchSelect id="client-nationality" options={NATIONALITIES.map((item) => ({ id: item, label: item }))} value={nationality} placeholder="Search..." onValueChange={setNationality} />
          </Field>
          <Field id="client-father-name" label="Father's Name">
            <Input id="client-father-name" value={fatherName} onChange={(event) => setFatherName(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-spouse-name" label="Spouse's Name">
            <Input id="client-spouse-name" value={spouseName} onChange={(event) => setSpouseName(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-dependents" label="Number Of Dependents">
            <Input id="client-dependents" type="number" min={0} step={1} value={dependents} onChange={(event) => setDependents(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <label htmlFor="client-disability" className="flex min-h-[var(--control-height)] items-center gap-2 self-end fs-text text-body">
            <input id="client-disability" type="checkbox" checked={disability} onChange={(event) => setDisability(event.target.checked)} className="size-4 accent-primary" />
            This member is a Person with Disability (PWD)
          </label>
        </FormSection>

        <FormSection
          id="contact-details"
          title="Contact Details"
          index={2}
          expanded={expandedSection === 2}
          disabled={unlockedSection < 2}
          onToggle={() => toggleSection(2)}
          onNext={() => advance(2)}
          canContinue={contactValid}
        >
          <Field id="client-country-code" label="Country code" required>
            <SearchSelect id="client-country-code" options={COUNTRY_CODES.map((item) => ({ id: item, label: item }))} value={countryCode} placeholder="Search..." onValueChange={setCountryCode} />
          </Field>
          <Field id="client-phone" label="Phone Number" required>
            <Input id="client-phone" value={phone} onChange={(event) => setPhone(event.target.value)} required inputMode="tel" className={INPUT_CLASS} />
          </Field>
          <Field id="client-mno" label="MNO">
            <SearchSelect id="client-mno" options={MNO_OPTIONS.map((item) => ({ id: item, label: item }))} value={mno} placeholder="Search..." onValueChange={setMno} />
          </Field>
          <Field id="client-email" label="Email Address">
            <Input id="client-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={INPUT_CLASS} />
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
          <Field id="client-national-id" label="National ID Number">
            <Input id="client-national-id" value={nationalId} onChange={(event) => setNationalId(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field id="client-tin" label="Tax Number">
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
          <Field id="client-current-residence" label="Current Residence Address">
            <Input id="client-current-residence" value={currentResidence} onChange={(event) => setCurrentResidence(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <label htmlFor="client-same-residence" className="flex min-h-[var(--control-height)] items-center gap-2 fs-text text-body">
            <input id="client-same-residence" type="checkbox" checked={sameResidence} onChange={(event) => setSameResidence(event.target.checked)} className="size-4 accent-primary" />
            Last Residence Is Same As Of Current
          </label>
          <Field id="client-last-residence" label="Last Residence Address">
            <Input id="client-last-residence" value={lastResidence} onChange={(event) => setLastResidence(event.target.value)} disabled={sameResidence} className={INPUT_CLASS} />
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
          canContinue={true}
        >
          <Field id="client-current-employment" label="Current Place Of Employment">
            <Input id="client-current-employment" value={currentEmployment} onChange={(event) => setCurrentEmployment(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <label htmlFor="client-same-employment" className="flex min-h-[var(--control-height)] items-center gap-2 fs-text text-body">
            <input id="client-same-employment" type="checkbox" checked={sameEmployment} onChange={(event) => setSameEmployment(event.target.checked)} className="size-4 accent-primary" />
            Last Place Of Employment Is Same As Of Current
          </label>
          <Field id="client-last-employment" label="Last Place Of Employment">
            <Input id="client-last-employment" value={lastEmployment} onChange={(event) => setLastEmployment(event.target.value)} disabled={sameEmployment} className={INPUT_CLASS} />
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

