"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";
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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/policies/credit-product">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Credit product policies
          </Link>
        </Button>
      </div>

      <PageHeader breadcrumb="Settings" title="Create credit product policy" description="Credit product policy definitions." />

      <form className="space-y-5 rounded-xl border border-card-border bg-surface p-5" onSubmit={(event) => void save(event)}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-code">
              Code
            </label>
            <Input id="cpp-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-name">
              Name
            </label>
            <Input id="cpp-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-status">
              Status
            </label>
            <select
              id="cpp-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as CreditProductPolicyStatus)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-description">
            Description
          </label>
          <textarea
            id="cpp-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] py-[var(--space-8)] fs-text"
          />
        </div>

        <div>
          <label className="mb-1 block fs-text font-medium text-body" htmlFor="cpp-content">
            Policy content (JSON)
          </label>
          <textarea
            id="cpp-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={8}
            className="w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] py-[var(--space-8)] font-mono fs-text"
          />
        </div>

        {saveError ? <p role="alert" className="fs-text text-accent-red">{saveError}</p> : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
            {saving ? "Saving..." : "Create credit product policy"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings/policies/credit-product">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
