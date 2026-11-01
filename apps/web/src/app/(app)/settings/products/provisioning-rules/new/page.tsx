"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { FormError, SuccessNote } from "@/components/accounting/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { createProvisioningRule, type ProvisioningRuleStatus } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export default function CreateProvisioningRulePage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const unsupportedRuleSchema = true;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProvisioningRuleStatus>("ACTIVE");
  const [daysFrom, setDaysFrom] = useState("0");
  const [daysTo, setDaysTo] = useState("");
  const [rate, setRate] = useState("0");
  const [glAccountId, setGlAccountId] = useState("");
  const [description, setDescription] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaved(null);
    if (unsupportedRuleSchema) {
      setSaveError("Saving is unavailable until category-based criteria and separate liability, expense, and income mappings are supported.");
      return;
    }

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    const from = Number(daysFrom);
    const to = daysTo.trim() === "" ? null : Number(daysTo);
    const percentage = Number(rate);
    if (!trimmedName) return setSaveError("Provisioning name is required.");
    if (!trimmedCode) return setSaveError("Code is required.");
    if (!Number.isFinite(from) || from < 0) return setSaveError("Minimum days must be a valid non-negative number.");
    if (to !== null && (!Number.isFinite(to) || to < from)) return setSaveError("Maximum days must be greater than or equal to minimum days.");
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) return setSaveError("Percentage must be between 0 and 100.");

    setSaving(true);
    try {
      await createProvisioningRule({
        code: trimmedCode,
        name: trimmedName,
        status,
        daysFrom: from,
        daysTo: to,
        rateBp: Math.round(percentage * 100),
        glAccountId: glAccountId.trim() || null,
        description: description.trim() || null,
      });
      setSaved("Provisioning rule created.");
      pushToast("Provisioning rule created.");
      router.push("/settings/products/provisioning-rules");
      router.refresh();
    } catch (failure) {
      setSaveError(message(failure, "Could not create this provisioning rule."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="fs-title font-semibold text-heading">Loan Provisioning Criteria</h1>

      <form onSubmit={(event) => void save(event)} className="space-y-6">
        <section className="min-h-[200px] space-y-6 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-6">
          <div>
            <label htmlFor="pr-name" className="mb-2 block fs-text font-medium text-body">Provisioning Name <span className="text-accent-red" aria-hidden="true">*</span></label>
            <Input id="pr-name" value={name} onChange={(event) => setName(event.target.value)} aria-required="true" aria-invalid={!name.trim()} aria-describedby={!name.trim() ? "pr-name-required" : undefined} className="h-[var(--control-height)]" />
            {!name.trim() ? <p id="pr-name-required" className="mt-2 fs-caption text-accent-red">Provisioning Name is Required Field</p> : null}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3 fs-text text-body">
            <input type="checkbox" checked={status === "ACTIVE"} onChange={(event) => setStatus(event.target.checked ? "ACTIVE" : "INACTIVE")} className="size-5 accent-[var(--primary)]" />
            <span>Active</span>
          </label>
        </section>

        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] table-fixed text-left fs-text">
              <thead className="border-b border-card-border bg-subtle font-semibold text-label">
                <tr>
                  <th className="px-2 py-3"><div className="whitespace-normal break-words text-xs leading-tight">Category <span className="text-accent-red" aria-hidden="true">*</span></div></th>
                  <th className="px-2 py-3"><div className="whitespace-normal break-words text-xs leading-tight">Min Days <span className="text-accent-red" aria-hidden="true">*</span></div></th>
                  <th className="px-2 py-3"><div className="whitespace-normal break-words text-xs leading-tight">Max Days <span className="text-accent-red" aria-hidden="true">*</span></div></th>
                  <th className="px-2 py-3"><div className="whitespace-normal break-words text-xs leading-tight">Percentage <span className="text-accent-red" aria-hidden="true">*</span></div></th>
                  <th className="px-2 py-3"><div className="whitespace-normal break-words text-xs leading-tight">Liability Account <span className="text-accent-red" aria-hidden="true">*</span></div></th>
                  <th className="px-2 py-3"><div className="whitespace-normal break-words text-xs leading-tight">Expenses Account <span className="text-accent-red" aria-hidden="true">*</span></div></th>
                  <th className="px-2 py-3"><div className="whitespace-normal break-words text-xs leading-tight">Income Account <span className="text-accent-red" aria-hidden="true">*</span></div></th>
                  <th className="px-2 py-3"><div className="whitespace-normal text-xs leading-tight">Actions</div></th>
                </tr>
              </thead>
              <tbody>
                <tr className="align-top">
                  <td className="p-2"><select disabled aria-label="Category" className="h-[var(--control-height)] w-full min-w-0 rounded-[var(--control-radius)] border border-input bg-background px-2 fs-text text-muted-foreground disabled:opacity-100"><option>Select Category</option></select></td>
                  <td className="p-2"><Input id="pr-days-from" type="number" min="0" defaultValue="" disabled aria-label="Minimum days" placeholder="In Days" className="h-[var(--control-height)] w-full min-w-0 px-2 disabled:opacity-100" /></td>
                  <td className="p-2"><Input id="pr-days-to" type="number" min="0" defaultValue="" disabled aria-label="Maximum days" placeholder="In Days" className="h-[var(--control-height)] w-full min-w-0 px-2 disabled:opacity-100" /></td>
                  <td className="p-2"><Input id="pr-rate" type="number" min="0" max="100" step="0.01" defaultValue="" disabled aria-label="Percentage" placeholder="Percentage" className="h-[var(--control-height)] w-full min-w-0 px-2 disabled:opacity-100" /></td>
                  <td className="p-2"><select disabled aria-label="Liability account" className="h-[var(--control-height)] w-full min-w-0 rounded-[var(--control-radius)] border border-input bg-background px-2 fs-text text-muted-foreground disabled:opacity-100"><option>Select Liability Account</option></select></td>
                  <td className="p-2"><select disabled aria-label="Expenses account" className="h-[var(--control-height)] w-full min-w-0 rounded-[var(--control-radius)] border border-input bg-background px-2 fs-text text-muted-foreground disabled:opacity-100"><option>Select Expense Account</option></select></td>
                  <td className="p-2"><select disabled aria-label="Income account" className="h-[var(--control-height)] w-full min-w-0 rounded-[var(--control-radius)] border border-input bg-background px-2 fs-text text-muted-foreground disabled:opacity-100"><option>Select Income Account</option></select></td>
                  <td className="p-2 text-center"><Button type="button" variant="ghost" size="icon" disabled aria-label="Add category" title="Multiple provisioning categories are not supported by the current model" className="text-primary disabled:opacity-60"><Plus aria-hidden="true" /></Button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="border-t border-chrome px-5 py-4 fs-caption text-muted-foreground">Category-based rules and separate liability, expense, and income accounts are not stored by the current provisioning model.</p>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-4">
          <div className="min-w-0"><FormError message={saveError} /><SuccessNote message={saved} /></div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary-tint hover:text-primary"><Link href="/settings/products/provisioning-rules"><ArrowLeft className="size-4" aria-hidden="true" />Cancel</Link></Button>
            <Button type="submit" disabled={saving || unsupportedRuleSchema} title="Save is unavailable until category-based criteria and separate account mappings are supported." aria-busy={saving} className="h-[var(--control-height)] px-4 fs-text font-semibold">{saving ? "Saving..." : "Save"}</Button>
          </div>
        </section>

        <details className="rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-4">
          <summary className="cursor-pointer fs-text font-medium text-heading">AIMSCAMS-specific fields</summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="pr-code" className="mb-1 block fs-text font-medium text-body">AIMSCAMS Code <span className="text-accent-red" aria-hidden="true">*</span></label>
              <Input id="pr-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label htmlFor="pr-description" className="mb-1 block fs-text font-medium text-body">Description</label>
              <Input id="pr-description" value={description} onChange={(event) => setDescription(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label htmlFor="pr-gl-account-id" className="mb-1 block fs-text font-medium text-body">AIMSCAMS General Ledger Account ID</label>
              <Input id="pr-gl-account-id" value={glAccountId} onChange={(event) => setGlAccountId(event.target.value)} className="h-[var(--control-height)]" />
              <p className="mt-1 fs-caption text-muted-foreground">The current model stores one account ID for a rule; separate accounting roles are unavailable.</p>
            </div>
          </div>
        </details>
      </form>
    </div>
  );
}
