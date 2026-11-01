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
import { parseMajorToMinor } from "@/lib/accounting";
import {
  createSavingsProduct,
  getSavingsProduct,
  updateSavingsProduct,
  type SavingsProduct,
  type SavingsProductStatus,
} from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

export function SavingsProductFormPage({ mode, productId }: { mode: "create" | "edit"; productId?: string }) {
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
  const [status, setStatus] = useState<SavingsProductStatus>("DRAFT");
  const [description, setDescription] = useState("");
  const [allowedAsGuarantor, setAllowedAsGuarantor] = useState(false);
  const [allowedAsCollateral, setAllowedAsCollateral] = useState(false);
  const [allowedMultipleAccounts, setAllowedMultipleAccounts] = useState(false);
  const [allowInterestPayout, setAllowInterestPayout] = useState(false);
  const [minBalance, setMinBalance] = useState("0");
  const [interestRate, setInterestRate] = useState("0");
  const [frequency, setFrequency] = useState("MONTHLY");

  useEffect(() => {
    if (!editing || !productId) {
      return;
    }
    let active = true;
    void getSavingsProduct(productId)
      .then((response) => {
        if (!active) return;
        const product = response.product;
        setCode(product.code);
        setName(product.name);
        setStatus(product.status);
        setDescription(product.description ?? "");
        setAllowedAsGuarantor(product.allowedAsGuarantor);
        setAllowedAsCollateral(product.allowedAsCollateral);
        setAllowedMultipleAccounts(product.allowedMultipleAccounts);
        setAllowInterestPayout(product.allowInterestPayout);
        setMinBalance((Number(product.minBalanceMinor) / 100).toFixed(2));
        setInterestRate((product.interestRateBp / 100).toFixed(2));
        setFrequency(product.interestPayoutFrequency);
      })
      .catch((failure: unknown) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 403) setForbidden(true);
        else if (failure instanceof ApiError && failure.status === 404) setNotFound(true);
        else setError(message(failure, "Could not load this savings product."));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editing, productId]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
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
    const minor = parseMajorToMinor(minBalance);
    if (minor === null) {
      setSaveError("Minimum balance must be a valid amount.");
      return;
    }
    const rate = Number(interestRate);
    if (!Number.isFinite(rate) || rate < 0) {
      setSaveError("Interest rate must be a valid number.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: trimmedCode,
        name: trimmedName,
        status,
        description: description.trim() || null,
        allowedAsGuarantor,
        allowedAsCollateral,
        allowedMultipleAccounts,
        allowInterestPayout,
        minBalanceMinor: minor.toString(),
        interestRateBp: Math.round(rate * 100),
        interestPayoutFrequency: frequency,
      };
      if (editing && productId) {
        await updateSavingsProduct(productId, payload);
        setSaved("Savings product saved.");
        pushToast("Savings product saved.");
      } else {
        const response = await createSavingsProduct(payload);
        pushToast("Savings product created.");
        router.push(`/settings/products/savings/${response.product.id}`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch (failure) {
      setSaveError(message(failure, "Could not save this savings product."));
    } finally {
      setSaving(false);
    }
  }

  if (forbidden) {
    return (
      <div className="space-y-5">
        <PageHeader breadcrumb="Settings" title="Savings product" description="Savings product terms." />
        <ForbiddenPanel message="Your role cannot edit savings products. Ask an administrator for Settings Product : Edit." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-5">
        <PageHeader title="Savings product" description="Savings product terms." />
        <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-24)] text-center">
          <p className="fs-text font-bold text-strong">Savings product not found</p>
          <p className="mt-1 fs-text text-muted-foreground">It may have been removed or the link is stale.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/settings/products/savings">Back to savings products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="fs-title font-semibold text-heading">{editing ? "Edit Savings Product" : "Create Savings Product"}</h1>
        <Button asChild variant="outline" className="h-[38px] border-primary px-3 text-primary hover:bg-primary-tint hover:text-primary">
          <Link href="/settings/products/savings"><ArrowLeft className="size-4" aria-hidden="true" />Savings products</Link>
        </Button>
      </div>

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : (
        <form onSubmit={(event) => void save(event)} className="space-y-4">
          <section className="rounded-[var(--card-radius)] border border-card-border bg-card">
            <header className="border-b border-chrome px-5 py-4"><h2 className="fs-text font-semibold text-strong">Details</h2></header>
            <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-name">Name <span className="text-accent-red" aria-hidden="true">*</span></label><Input id="sp-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" /></div>
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-type">Type <span className="text-accent-red" aria-hidden="true">*</span></label><select id="sp-type" disabled aria-describedby="sp-contract-note" className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-subtle px-3 fs-text text-muted-foreground"><option>Not available in this product model</option></select></div>
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-code">Product Code</label><Input id="sp-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" /></div>
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-status">Status</label><select id="sp-status" value={status} onChange={(event) => setStatus(event.target.value as SavingsProductStatus)} className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text"><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
              <div className="md:col-span-2"><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-description">Description</label><textarea id="sp-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded-[var(--control-radius)] border border-input bg-background px-3 py-2 fs-text" /></div>
            </div>
          </section>

          <section className="rounded-[var(--card-radius)] border border-card-border bg-card">
            <header className="border-b border-chrome px-5 py-4"><h2 className="fs-text font-semibold text-strong">Terms</h2></header>
            <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-min-balance">Minimum Balance <span className="text-accent-red" aria-hidden="true">*</span></label><Input id="sp-min-balance" value={minBalance} onChange={(event) => setMinBalance(event.target.value)} className="h-[var(--control-height)]" /></div>
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-min-transaction">Minimum Transaction Amount</label><Input id="sp-min-transaction" disabled placeholder="Not available in this product model" className="h-[var(--control-height)]" /></div>
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-max-transaction">Maximum Transaction Amount</label><Input id="sp-max-transaction" disabled placeholder="Not available in this product model" className="h-[var(--control-height)]" /></div>
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-permission">Permission</label><select id="sp-permission" disabled className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-subtle px-3 fs-text text-muted-foreground"><option>Not available in this product model</option></select></div>
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-rate">Interest rate (%)</label><Input id="sp-rate" value={interestRate} onChange={(event) => setInterestRate(event.target.value)} className="h-[var(--control-height)]" /></div>
              <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-frequency">Interest payout frequency</label><Input id="sp-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value)} className="h-[var(--control-height)]" /></div>
              <div className="grid gap-3 sm:grid-cols-2 md:col-span-2 md:grid-cols-3">
                <label className="flex items-center gap-2 fs-text text-strong"><input type="checkbox" checked={allowedAsGuarantor} onChange={(event) => setAllowedAsGuarantor(event.target.checked)} className="size-4 accent-primary" />Allowed As Guarantor</label>
                <label className="flex items-center gap-2 fs-text text-strong"><input type="checkbox" checked={allowedAsCollateral} onChange={(event) => setAllowedAsCollateral(event.target.checked)} className="size-4 accent-primary" />Allowed As Collateral</label>
                <label className="flex items-center gap-2 fs-text text-strong"><input type="checkbox" checked={allowedMultipleAccounts} onChange={(event) => setAllowedMultipleAccounts(event.target.checked)} className="size-4 accent-primary" />Allowed Multiple Accounts</label>
                <label className="flex items-center gap-2 fs-text text-strong"><input type="checkbox" checked={allowInterestPayout} onChange={(event) => setAllowInterestPayout(event.target.checked)} className="size-4 accent-primary" />Allow Interest Payout</label>
                <label className="flex items-center gap-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Default Auto Debit Account</label>
                <label className="flex items-center gap-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Primary Account</label>
              </div>
            </div>
          </section>

          <section className="rounded-[var(--card-radius)] border border-card-border bg-card">
            <header className="border-b border-chrome px-5 py-4"><h2 className="fs-text font-semibold text-strong">Savings Product Charges</h2></header>
            <div className="space-y-4 px-5 py-4">
              <label className="flex items-center gap-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Add Charges On Transfer</label>
              <div id="sp-contract-note" className="rounded-md border border-dashed border-card-border bg-subtle px-4 py-5 fs-text text-muted-foreground">Charge rules and transaction-charge selectors are not supported by the current savings product model.</div>
            </div>
          </section>

          <section className="rounded-[var(--card-radius)] border border-card-border bg-card">
            <header className="border-b border-chrome px-5 py-4"><h2 className="fs-text font-semibold text-strong">Accounting</h2></header>
            <div className="space-y-4 px-5 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-account-name">Account Name</label><Input id="sp-account-name" disabled placeholder="Not available in this product model" className="h-[var(--control-height)]" /></div>
                <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-ledger">General Ledger Code</label><Input id="sp-ledger" disabled placeholder="Not available in this product model" className="h-[var(--control-height)]" /></div>
                <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-payout-account">Interest Payout Account Name</label><Input id="sp-payout-account" disabled placeholder="Not available in this product model" className="h-[var(--control-height)]" /></div>
                <div><label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-payout-ledger">Interest Payout General Ledger Code</label><Input id="sp-payout-ledger" disabled placeholder="Not available in this product model" className="h-[var(--control-height)]" /></div>
              </div>
              <p className="fs-text text-muted-foreground">Ledger-account mappings are not persisted by the current savings product model.</p>
            </div>
          </section>

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--card-radius)] border border-card-border bg-card px-5 py-4">
            <div className="min-w-0"><FormError message={saveError} /><SuccessNote message={saved} /></div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline"><Link href="/settings/products/savings">Cancel</Link></Button>
              <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-4 fs-text font-semibold">{saving ? "Saving..." : editing ? "Save changes" : "Create"}</Button>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}
