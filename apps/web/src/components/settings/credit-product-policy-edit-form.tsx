"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";
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
      .catch(() => {})
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

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/settings/policies/credit-product/${id}`}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Credit product policy
          </Link>
        </Button>
      </div>

      <PageHeader title="Edit credit product policy" description="Credit product policy definitions." />

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
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button asChild variant="outline">
            <Link href={`/settings/policies/credit-product/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
