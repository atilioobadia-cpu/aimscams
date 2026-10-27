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
        <PageHeader title="Membership policy" description="Membership policy definitions." />
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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/policies/membership">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Membership policies
          </Link>
        </Button>
      </div>

      <PageHeader
        title={editing ? "Edit membership policy" : "Create membership policy"}
        description="Membership policy definitions."
      />

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : (
        <form className="space-y-5 rounded-xl border border-card-border bg-surface p-5" onSubmit={(event) => void save(event)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-code">
                Code
              </label>
              <Input id="mp-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-name">
                Name
              </label>
              <Input id="mp-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-status">
                Status
              </label>
              <select
                id="mp-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as MembershipPolicyStatus)}
                className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-member-type">
                Member type
              </label>
              <Input id="mp-member-type" value={memberType} onChange={(event) => setMemberType(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-min-nok">
                Minimum next of kin
              </label>
              <Input id="mp-min-nok" value={minNextOfKin} onChange={(event) => setMinNextOfKin(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-max-nok">
                Maximum next of kin
              </label>
              <Input id="mp-max-nok" value={maxNextOfKin} onChange={(event) => setMaxNextOfKin(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-dormant">
                Dormant days
              </label>
              <Input id="mp-dormant" value={dormantDays} onChange={(event) => setDormantDays(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-verification">
                Verification type
              </label>
              <Input id="mp-verification" value={verificationType} onChange={(event) => setVerificationType(event.target.value)} className="h-[var(--control-height)]" />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <label className="flex items-center gap-2 fs-text text-strong">
              <input type="checkbox" checked={allowWithdraw} onChange={(event) => setAllowWithdraw(event.target.checked)} />
              Allow withdraw
            </label>
            <label className="flex items-center gap-2 fs-text text-strong">
              <input type="checkbox" checked={autoActive} onChange={(event) => setAutoActive(event.target.checked)} />
              Auto active upon deposit
            </label>
            <label className="flex items-center gap-2 fs-text text-strong">
              <input type="checkbox" checked={enableVerification} onChange={(event) => setEnableVerification(event.target.checked)} />
              Enable member verification
            </label>
          </div>

          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="mp-description">
              Description
            </label>
            <textarea
              id="mp-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] py-[var(--space-8)] fs-text"
            />
          </div>

          <FormError message={saveError} />
          <SuccessNote message={saved} />

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
              {saving ? "Saving..." : editing ? "Save changes" : "Create membership policy"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/policies/membership">Cancel</Link>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
