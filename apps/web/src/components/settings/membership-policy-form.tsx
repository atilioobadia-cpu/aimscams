"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, SuccessNote, FormError } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import {
  createMembershipPolicy,
  getMembershipPolicy,
  updateMembershipPolicy,
  type MembershipPolicy,
  type MembershipPolicyStatus,
} from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export function MembershipPolicyFormPage({ mode, policyId }: { mode: "create" | "edit"; policyId?: string }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const editing = mode === "edit";
  const [loading, setLoading] = useState(editing);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<MembershipPolicyStatus>("DRAFT");
  const [memberType, setMemberType] = useState("INDIVIDUAL");
  const [minNextOfKin, setMinNextOfKin] = useState("1");
  const [maxNextOfKin, setMaxNextOfKin] = useState("2");
  const [dormantDays, setDormantDays] = useState("365");
  const [allowWithdraw, setAllowWithdraw] = useState(true);
  const [autoActive, setAutoActive] = useState(false);
  const [enableVerification, setEnableVerification] = useState(false);
  const [verificationType, setVerificationType] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!editing || !policyId) return;
    let active = true;
    void getMembershipPolicy(policyId)
      .then((response) => {
        if (!active) return;
        const policy = response.item;
        setCode(policy.code);
        setName(policy.name);
        setStatus(policy.status);
        setMemberType(policy.memberType);
        setMinNextOfKin(String(policy.minNextOfKin));
        setMaxNextOfKin(String(policy.maxNextOfKin));
        setDormantDays(String(policy.dormantDays));
        setAllowWithdraw(policy.allowWithdraw);
        setAutoActive(policy.autoActiveUponDeposit);
        setEnableVerification(policy.enableMemberVerification);
        setVerificationType(policy.verificationType ?? "");
        setDescription(policy.description ?? "");
      })
      .catch((failure: unknown) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else if (failure instanceof ApiError && failure.status === 404) setNotFound(true);
        else setError(message(failure, "Could not load this membership policy."));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editing, policyId]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaved(null);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (!trimmedCode) {
      setSaveError("Code is required.");
      return;
    }
    if (!trimmedName) {
      setSaveError("Name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: trimmedCode,
        name: trimmedName,
        status,
        description: description.trim() || null,
        memberType,
        minNextOfKin: Number(minNextOfKin),
        maxNextOfKin: Number(maxNextOfKin),
        dormantDays: Number(dormantDays),
        allowWithdraw,
        autoActiveUponDeposit: autoActive,
        enableMemberVerification: enableVerification,
        verificationType: verificationType.trim() || null,
      };
      if (editing && policyId) {
        await updateMembershipPolicy(policyId, payload);
        setSaved("Membership policy saved.");
        pushToast("Membership policy saved.");
      } else {
        await createMembershipPolicy(payload);
        pushToast("Membership policy created.");
        router.push("/settings/policies/membership");
        router.refresh();
        return;
      }
      router.refresh();
    } catch (failure) {
      setSaveError(message(failure, "Could not save this membership policy."));
    } finally {
      setSaving(false);
    }
  }

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader breadcrumb="Settings" title="Membership policy" description="Membership policy definitions." />
        <ForbiddenPanel message="Your role cannot edit membership policies. Ask an administrator for Settings Policy : Edit." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-5">
        <PageHeader title="Membership policy" description="Membership policy definitions." />
        <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-24)] text-center">
          <p className="fs-text font-bold text-strong">Membership policy not found</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/settings/policies/membership">Back to membership policies</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="fs-title font-semibold text-heading">{editing ? "Edit Membership Policy" : "Create Membership Policy"}</h1>
        <Button asChild variant="outline" className="h-[38px] border-primary px-3 text-primary hover:bg-primary-tint hover:text-primary"><Link href="/settings/policies/membership"><ArrowLeft className="size-4" aria-hidden="true" />Membership policies</Link></Button>
      </div>

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : (
        <form onSubmit={(event) => void save(event)} className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <section className="space-y-4 border-b border-chrome px-5 py-5">
            <h2 className="fs-text font-semibold text-strong">ⓘ Basic Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-name">Name <span className="text-accent-red" aria-hidden="true">*</span></label><Input id="mp-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" /></div>
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-member-type">Member Type <span className="text-accent-red" aria-hidden="true">*</span></label><select id="mp-member-type" value={memberType} onChange={(event) => setMemberType(event.target.value)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"><option value="INDIVIDUAL">Individual</option><option value="GROUP">Group</option></select></div>
              <div className="md:col-span-2"><label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-description">Description</label><textarea id="mp-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded-[var(--control-radius)] border border-input bg-background px-3 py-2 fs-text" /></div>
            </div>
          </section>

          <section className="space-y-4 border-b border-chrome px-5 py-5">
            <h2 className="fs-text font-semibold text-strong">♙ Next of Kin</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-min-nok">Minimum Next of Kin <span className="text-accent-red" aria-hidden="true">*</span></label><Input id="mp-min-nok" type="number" min="0" value={minNextOfKin} onChange={(event) => setMinNextOfKin(event.target.value)} className="h-[var(--control-height)]" /></div>
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-max-nok">Maximum Next of Kin <span className="text-accent-red" aria-hidden="true">*</span></label><Input id="mp-max-nok" type="number" min={minNextOfKin} value={maxNextOfKin} onChange={(event) => setMaxNextOfKin(event.target.value)} className="h-[var(--control-height)]" /></div>
            </div>
          </section>

          <section className="space-y-4 border-b border-chrome px-5 py-5">
            <h2 className="fs-text font-semibold text-strong">◷ Member Dormancy</h2>
            <div className="max-w-[520px]"><label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-dormant">Dormant Days <span className="text-accent-red" aria-hidden="true">*</span></label><Input id="mp-dormant" type="number" min="0" value={dormantDays} onChange={(event) => setDormantDays(event.target.value)} className="h-[var(--control-height)]" /></div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 fs-text text-strong"><input type="checkbox" checked={allowWithdraw} onChange={(event) => setAllowWithdraw(event.target.checked)} className="size-4 accent-primary" />Allow Withdraw</label>
              <label className="flex items-center gap-2 fs-text text-strong"><input type="checkbox" checked={autoActive} onChange={(event) => setAutoActive(event.target.checked)} className="size-4 accent-primary" />Auto Active Upon Deposit</label>
            </div>
          </section>

          <section className="space-y-3 border-b border-chrome px-5 py-5">
            <h2 className="fs-text font-semibold text-strong">♙ Allow Minors</h2>
            <label className="flex items-center gap-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Allow Minors</label>
            <p className="fs-caption text-muted-foreground">Minor eligibility and age limits are not represented in the current membership policy model.</p>
          </section>

          {memberType === "GROUP" ? (
            <section className="space-y-4 border-b border-chrome px-5 py-5">
              <h2 className="fs-text font-semibold text-strong">♙ Group Settings</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div><label className="mb-1 block fs-text font-medium text-body">Group Type</label><select disabled className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-subtle px-3 fs-text text-muted-foreground"><option>Not available in this policy model</option></select></div>
                <div><label className="mb-1 block fs-text font-medium text-body">Minimum Number of Members</label><Input disabled placeholder="Not available in this policy model" className="h-[var(--control-height)]" /></div>
                <div><label className="mb-1 block fs-text font-medium text-body">Maximum Number of Members</label><Input disabled placeholder="Not available in this policy model" className="h-[var(--control-height)]" /></div>
                <div><label className="mb-1 block fs-text font-medium text-body">Minimum Number of Signatories</label><Input disabled placeholder="Not available in this policy model" className="h-[var(--control-height)]" /></div>
                <div><label className="mb-1 block fs-text font-medium text-body">Minimum Share Required</label><Input disabled placeholder="Not available in this policy model" className="h-[var(--control-height)]" /></div>
              </div>
              <label className="flex items-center gap-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Allow Member In Multiple Groups</label>
              <p className="fs-caption text-muted-foreground">Group classification, membership limits, signatories, share requirements, and multiple-group behavior are not persisted by the current policy model.</p>
            </section>
          ) : null}

          <section className="space-y-3 border-b border-chrome px-5 py-5">
            <h2 className="fs-text font-semibold text-strong">▣ Mandatory Savings</h2>
            <label className="flex items-center gap-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Enable Mandatory Savings</label>
            <p className="fs-caption text-muted-foreground">Mandatory savings product and amount settings are not saved by the current model.</p>
          </section>

          <section className="space-y-3 border-b border-chrome px-5 py-5">
            <h2 className="fs-text font-semibold text-strong">♧ Mandatory Shares</h2>
            <label className="flex items-center gap-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Enable Mandatory Shares</label>
            <p className="fs-caption text-muted-foreground">Mandatory share product and amount settings are not saved by the current model.</p>
          </section>

          <section className="space-y-4 border-b border-chrome px-5 py-5">
            <h2 className="fs-text font-semibold text-strong">▧ Membership Policy Fees</h2>
            <div className="rounded-md border border-dashed border-card-border bg-subtle p-4">
              <p className="mb-3 fs-text font-medium text-body">Fee</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div><label className="mb-1 block fs-text font-medium text-body">Fee Type</label><select disabled className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-subtle px-3 fs-text text-muted-foreground"><option>Not available in this policy model</option></select></div>
                <div><label className="mb-1 block fs-text font-medium text-body">Charges Type</label><select disabled className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-subtle px-3 fs-text text-muted-foreground"><option>Not available in this policy model</option></select></div>
                <div><label className="mb-1 block fs-text font-medium text-body">Amount (TSh)</label><Input disabled placeholder="Not available in this policy model" className="h-[var(--control-height)]" /></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Auto Debit</label>
                <label className="flex items-center gap-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Apply To Migrated Members</label>
              </div>
            </div>
            <Button type="button" variant="outline" disabled className="border-primary text-primary"><span className="fs-text">＋</span>Add Fee</Button>
            <p className="fs-caption text-muted-foreground">Fee rules, amounts, auto-debit and migration settings are not persisted by this model.</p>
          </section>

          <section className="space-y-4 border-b border-chrome px-5 py-5">
            <h2 className="fs-text font-semibold text-strong">✓ Member Activation</h2>
            <label className="flex items-center gap-2 fs-text text-strong"><input type="checkbox" checked={enableVerification} onChange={(event) => setEnableVerification(event.target.checked)} className="size-4 accent-primary" />Enable Member Verification Required</label>
            {enableVerification ? <div className="max-w-[520px]"><label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-verification">Verification Type</label><Input id="mp-verification" value={verificationType} onChange={(event) => setVerificationType(event.target.value)} className="h-[var(--control-height)]" /></div> : null}
            <label className="flex items-center gap-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Allow Deactivate or Exit</label>
            <p className="fs-caption text-muted-foreground">Deactivate/exit behavior is not represented in the current membership policy model.</p>
          </section>

          <section className="space-y-3 border-b border-chrome px-5 py-5">
            <h2 className="fs-text font-semibold text-strong">◇ Mandatory Credit Products</h2>
            <label className="flex items-center gap-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Enable Credit Product Mapping</label>
            <p className="fs-caption text-muted-foreground">Mandatory credit-product mappings are not saved by the current model.</p>
          </section>

          <section className="space-y-4 px-5 py-5">
            <h2 className="fs-text font-semibold text-strong">AIMSCAMS Configuration</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-code">Code <span className="text-accent-red" aria-hidden="true">*</span></label><Input id="mp-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" /></div>
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-status">Status</label><select id="mp-status" value={status} onChange={(event) => setStatus(event.target.value as MembershipPolicyStatus)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-chrome bg-card px-5 py-4">
            <div className="min-w-0"><FormError message={saveError} /><SuccessNote message={saved} /></div>
            <div className="flex items-center gap-3"><Button asChild variant="outline" className="border-primary text-primary hover:bg-primary-tint hover:text-primary"><Link href="/settings/policies/membership">Cancel</Link></Button><Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-4 fs-text font-semibold">{saving ? "Saving..." : "Submit"}</Button></div>
          </div>
        </form>
      )}
    </div>
  );
}
