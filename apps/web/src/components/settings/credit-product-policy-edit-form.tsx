"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import {
  getCreditProductPolicy,
  updateCreditProductPolicy,
  type CreditProductPolicyStatus,
} from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export function CreditProductPolicyEditForm({ id }: { id: string }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<CreditProductPolicyStatus>("DRAFT");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("{}");

  useEffect(() => {
    let active = true;
    void getCreditProductPolicy(id)
      .then((response) => {
        if (!active) return;
        setCode(response.item.code);
        setName(response.item.name);
        setStatus(response.item.status);
        setDescription(response.item.description ?? "");
        setContent(JSON.stringify(response.item.content ?? {}, null, 2));
      })
      .catch((failure: unknown) => {
        if (!active) return;
        setLoadError(message(failure, "Could not load this credit product policy."));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

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

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      setSaveError("Policy content must be valid JSON.");
      return;
    }

    setSaving(true);
    try {
      await updateCreditProductPolicy(id, {
        code: trimmedCode,
        name: trimmedName,
        status,
        description: description.trim() || null,
        content: parsed,
      });
      pushToast("Credit product policy updated.");
      router.push(`/settings/policies/credit-product/${id}`);
      router.refresh();
    } catch (failure) {
      setSaveError(message(failure, "Could not update this credit product policy."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="fs-text text-muted-foreground">Loading...</p>;
  }

  if (loadError) {
    const invalidId = loadError.toLowerCase().includes("uuid is expected");
    const missing = invalidId || loadError.toLowerCase().includes("not found");
    return (
      <div className="space-y-4">
        <div className="rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-4">
          <h1 className="fs-title font-semibold text-heading">{missing ? "Credit Product Policy Not Found" : "Could Not Load Credit Product Policy"}</h1>
        </div>
        <div className="rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-6">
          <p role="alert" className="fs-text text-body">{invalidId ? "This reference ID is not a valid AIMSCAMS policy ID." : loadError}</p>
          <Button asChild variant="outline" className="mt-4 border-primary text-primary hover:bg-primary-tint hover:text-primary">
            <Link href="/settings/policies/credit-product"><ArrowLeft className="size-4" aria-hidden="true" />Back to Credit Product Policies</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-4">
        <h1 className="fs-title font-semibold text-heading">Edit Credit Product Policy</h1>
      </div>

      <form onSubmit={(event) => void save(event)} className="space-y-2">
        <details open className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <summary className="cursor-pointer list-none border-b border-chrome bg-subtle px-4 py-4 fs-text font-semibold text-strong hover:bg-primary-tint">Basic Details</summary>
          <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
            <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-code">Code <span className="text-accent-red" aria-hidden="true">*</span></label><Input id="cpp-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" /></div>
            <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-name">Name <span className="text-accent-red" aria-hidden="true">*</span></label><Input id="cpp-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" /></div>
            <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-loan-type">Loan Type</label><select id="cpp-loan-type" disabled className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-subtle px-3 fs-text text-muted-foreground"><option>Not available in this policy model</option></select></div>
            <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-status">Status</label><select id="cpp-status" value={status} onChange={(event) => setStatus(event.target.value as CreditProductPolicyStatus)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
            <div className="md:col-span-2"><label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-description">Description</label><textarea id="cpp-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded-[var(--control-radius)] border border-input bg-background px-3 py-2 fs-text" /></div>
            <p className="md:col-span-2 fs-caption text-muted-foreground">Typed lending terms and approvals are not available in this policy model.</p>
          </div>
        </details>

        {["Terms", "Settings", "Repayment", "Interest", "Income", "Quick Loan", "Loan Stages"].map((section) => (
          <details key={section} className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
            <summary className="cursor-pointer list-none border-b border-chrome bg-subtle px-4 py-4 fs-text font-semibold text-strong hover:bg-primary-tint">{section}</summary>
            <div className="px-5 py-5"><p className="fs-text text-muted-foreground">Fields in this section are not persisted by the current credit product policy model.</p></div>
          </details>
        ))}

        <details open className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <summary className="cursor-pointer list-none border-b border-chrome bg-subtle px-4 py-4 fs-text font-semibold text-strong hover:bg-primary-tint">Accounting Setting</summary>
          <div className="space-y-4 px-5 py-5">
            <div className="grid gap-4 md:grid-cols-3">
              {["Loan Portfolio Account", "Accrued Account", "Income From Interest", "Expenses Losses Written Off", "Overpayment Account", "Loan Suspense Account"].map((account) => (
                <div key={account} className="space-y-3">
                  <div><label className="mb-1 block fs-text font-medium text-body">{account}</label><Input disabled placeholder="Not available in this policy model" className="h-[var(--control-height)]" /></div>
                  <div><label className="mb-1 block fs-text font-medium text-body">General Ledger Code</label><select disabled className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-subtle px-3 fs-text text-muted-foreground"><option>Not available in this policy model</option></select></div>
                  <div><label className="mb-1 block fs-text font-medium text-body">Type</label><Input disabled placeholder="Not available in this policy model" className="h-[var(--control-height)]" /></div>
                </div>
              ))}
            </div>
            <p className="fs-caption text-muted-foreground">Accounting mappings are not persisted by the current credit product policy model.</p>
          </div>
        </details>

        <details className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <summary className="cursor-pointer list-none border-b border-chrome bg-subtle px-4 py-4 fs-text font-semibold text-strong hover:bg-primary-tint">AIMSCAMS Policy Payload</summary>
          <div className="space-y-4 px-5 py-5"><div><label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-content">Policy content (JSON)</label><textarea id="cpp-content" value={content} onChange={(event) => setContent(event.target.value)} rows={8} className="w-full rounded-[var(--control-radius)] border border-input bg-background px-3 py-2 font-mono fs-text" /><p className="mt-1 fs-caption text-muted-foreground">This flexible JSON document is the only place the current policy model stores lending configuration.</p></div></div>
        </details>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-4">
          {saveError ? <p role="alert" className="fs-text text-accent-red">{saveError}</p> : <span />}
          <div className="flex items-center gap-3"><Button asChild variant="outline" className="border-primary text-primary hover:bg-primary-tint hover:text-primary"><Link href={`/settings/policies/credit-product/${id}`}><ArrowLeft className="size-4" aria-hidden="true" />Cancel</Link></Button><Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-4 fs-text font-semibold">{saving ? "Saving..." : "Save Changes"}</Button></div>
        </div>
      </form>
    </div>
  );
}
