"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { createCreditProductPolicy, type CreditProductPolicyStatus } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function CreateCreditProductPolicyPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<CreditProductPolicyStatus>("DRAFT");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("{}");

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
      await createCreditProductPolicy({
        code: trimmedCode,
        name: trimmedName,
        status,
        description: description.trim() || null,
        content: parsed,
      });
      pushToast("Credit product policy created.");
      router.push("/settings/policies/credit-product");
      router.refresh();
    } catch (failure) {
      setSaveError(message(failure, "Could not create this credit product policy."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-4">
        <h1 className="fs-title font-semibold text-heading">Create Credit Product Policy</h1>
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
            <p className="md:col-span-2 fs-caption text-muted-foreground">The current policy API stores the policy identity and flexible JSON content. It does not expose typed lending terms.</p>
          </div>
        </details>

        {[
          ["Terms", ["Minimum Loan Amount", "Maximum Loan Amount", "Minimum Tenure", "Maximum Tenure"]],
          ["Settings", ["Loan Type", "Currency", "Approval Required", "Collateral Required"]],
          ["Repayment", ["Repayment Frequency", "Repayment Strategy", "Grace Period", "Installments"]],
          ["Interest", ["Interest Type", "Interest Rate", "Interest Period", "Rate Calculation"]],
          ["Income", ["Processing Fee", "Late Payment Fee", "Other Income"]],
          ["Quick Loan", ["Enable Quick Loan"]],
          ["Loan Stages", ["Stage Name", "Approver", "Default Stage"]],
        ].map(([section, fields]) => (
          <details key={section as string} className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
            <summary className="cursor-pointer list-none border-b border-chrome bg-subtle px-4 py-4 fs-text font-semibold text-strong hover:bg-primary-tint">{section as string}</summary>
            <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
              {(fields as string[]).map((field) => <div key={field}><label className="mb-1 block fs-text font-medium text-body">{field}</label><Input disabled placeholder="Not available in this policy model" className="h-[var(--control-height)]" /></div>)}
              <p className="md:col-span-2 fs-caption text-muted-foreground">{section as string} terms are not represented as structured fields by the current policy model.</p>
            </div>
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
          <div className="space-y-4 px-5 py-5">
            <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-content">Policy content (JSON)</label><textarea id="cpp-content" value={content} onChange={(event) => setContent(event.target.value)} rows={8} className="w-full rounded-[var(--control-radius)] border border-input bg-background px-3 py-2 font-mono fs-text" /><p className="mt-1 fs-caption text-muted-foreground">This flexible JSON document is the only place the current policy model stores lending configuration.</p></div>
          </div>
        </details>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-4">
          {saveError ? <p role="alert" className="fs-text text-accent-red">{saveError}</p> : <span />}
          <div className="flex items-center gap-3"><Button asChild variant="outline" className="border-primary text-primary hover:bg-primary-tint hover:text-primary"><Link href="/settings/policies/credit-product"><ArrowLeft className="size-4" aria-hidden="true" />Cancel</Link></Button><Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-4 fs-text font-semibold">{saving ? "Saving..." : "Create"}</Button></div>
        </div>
      </form>
    </div>
  );
}
