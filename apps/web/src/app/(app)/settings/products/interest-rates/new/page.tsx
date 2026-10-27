"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, SuccessNote, FormError } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { createInterestRate, type InterestRateStatus } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function CreateInterestRatePage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<InterestRateStatus>("ACTIVE");
  const [rate, setRate] = useState("0");
  const [period, setPeriod] = useState("ANNUAL");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [description, setDescription] = useState("");

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
    const rateBp = Number(rate);
    if (!Number.isFinite(rateBp) || rateBp < 0) {
      setSaveError("Rate must be a valid number.");
      return;
    }

    setSaving(true);
    try {
      await createInterestRate({
        code: trimmedCode,
        name: trimmedName,
        status,
        rateBp: Math.round(rateBp * 100),
        period,
        description: description.trim() || null,
        effectiveFrom: effectiveFrom || null,
      });
      setSaved("Interest rate created.");
      pushToast("Interest rate created.");
      router.push("/settings/products/interest-rates");
      router.refresh();
    } catch (failure) {
      setSaveError(message(failure, "Could not create this interest rate."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/products/interest-rates">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Interest rates
          </Link>
        </Button>
      </div>

      <PageHeader title="Create interest rate" description="Interest rate definitions used by products." />

      <form className="space-y-5 rounded-xl border border-card-border bg-surface p-5" onSubmit={(event) => void save(event)}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-fs font-medium text-body" htmlFor="ir-code">
              Code
            </label>
            <Input id="ir-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block text-fs font-medium text-body" htmlFor="ir-name">
              Name
            </label>
            <Input id="ir-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block text-fs font-medium text-body" htmlFor="ir-status">
              Status
            </label>
            <select
              id="ir-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as InterestRateStatus)}
              className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-fs"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-fs font-medium text-body" htmlFor="ir-rate">
              Rate (%)
            </label>
            <Input id="ir-rate" value={rate} onChange={(event) => setRate(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block text-fs font-medium text-body" htmlFor="ir-period">
              Period
            </label>
            <Input id="ir-period" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block text-fs font-medium text-body" htmlFor="ir-effective">
              Effective from
            </label>
            <Input id="ir-effective" type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} className="h-[var(--control-height)]" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-fs font-medium text-body" htmlFor="ir-description">
            Description
          </label>
          <textarea
            id="ir-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] py-[var(--space-8)] text-fs"
          />
        </div>

        <FormError message={saveError} />
        <SuccessNote message={saved} />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] text-fs font-semibold">
            {saving ? "Saving..." : "Create interest rate"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings/products/interest-rates">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
