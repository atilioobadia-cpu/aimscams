"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SuccessNote, FormError } from "@/components/accounting/states";
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
    <div className="space-y-4">
      <h1 className="fs-title font-semibold text-heading">Create Interest Rate</h1>

      <form className="space-y-0 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-5" onSubmit={(event) => void save(event)}>
        <section className="space-y-5">
          <h2 className="fs-section-title font-semibold text-strong">ⓘ Details</h2>
          <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ir-name">Name <span className="text-accent-red" aria-hidden="true">*</span></label>
              <Input id="ir-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ir-description">Description</label>
              <textarea id="ir-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded-[var(--control-radius)] border border-input bg-background px-3 py-2 fs-text" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ir-frequency-type">Frequency Type <span className="text-accent-red" aria-hidden="true">*</span></label>
              <select id="ir-frequency-type" disabled className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-subtle px-3 fs-text text-muted-foreground"><option>Not available in this product model</option></select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ir-frequency">Frequency <span className="text-accent-red" aria-hidden="true">*</span></label>
              <Input id="ir-frequency" disabled placeholder="Not available in this product model" className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ir-effective">Start Date <span className="text-accent-red" aria-hidden="true">*</span></label>
              <Input id="ir-effective" type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="ir-end-date">End Date <span className="text-accent-red" aria-hidden="true">*</span></label>
              <Input id="ir-end-date" type="date" disabled placeholder="Not available in this product model" className="h-[var(--control-height)]" />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="fs-text font-medium text-body">Interest Rate Type <span className="text-accent-red" aria-hidden="true">*</span></legend>
            <div className="flex items-center gap-6 fs-text text-muted-foreground">
              <label className="flex items-center gap-2"><input type="radio" name="ir-type" checked readOnly disabled className="size-4 accent-primary" />Fixed</label>
              <label className="flex items-center gap-2"><input type="radio" name="ir-type" disabled className="size-4" />Variable</label>
            </div>
            <p className="fs-caption text-muted-foreground">The current interest-rate model stores one rate and does not save a fixed/variable type.</p>
          </fieldset>
        </section>

        <section className="mt-7 border-t border-chrome pt-5">
          <h2 className="fs-section-title font-semibold text-strong">% Fixed Interest Rate</h2>
          <div className="mt-4 max-w-[min(100%,500px)]">
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="ir-rate">Rate Of Interest <span className="text-accent-red" aria-hidden="true">*</span></label>
            <Input id="ir-rate" inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} className="h-[var(--control-height)]" />
          </div>
        </section>

        <section className="mt-7 border-t border-chrome pt-5">
          <h2 className="fs-section-title font-semibold text-strong">AIMSCAMS Configuration</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="ir-code">Code <span className="text-accent-red" aria-hidden="true">*</span></label><Input id="ir-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" /></div>
            <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="ir-status">Status</label><select id="ir-status" value={status} onChange={(event) => setStatus(event.target.value as InterestRateStatus)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
            <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="ir-period">Period</label><Input id="ir-period" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-[var(--control-height)]" /></div>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-chrome pt-5">
          <div className="min-w-0"><FormError message={saveError} /><SuccessNote message={saved} /></div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary-tint hover:text-primary"><Link href="/settings/products/interest-rates"><ArrowLeft className="size-4" aria-hidden="true" />Cancel</Link></Button>
            <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-4 fs-text font-semibold">{saving ? "Saving..." : "Create"}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
