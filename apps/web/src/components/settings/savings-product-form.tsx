"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

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
        <PageHeader title="Savings product" description="Savings product terms." />
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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/products/savings">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Savings products
          </Link>
        </Button>
      </div>

      <PageHeader
        title={editing ? "Edit savings product" : "Create savings product"}
        description="Savings product terms. Accounts snapshot these terms at opening."
      />

      {loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : (
        <form onSubmit={(event) => void save(event)} className="space-y-5 rounded-xl border border-card-border bg-surface p-5">
          {!editing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-code">
                  Code
                </label>
                <Input id="sp-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-name">
                  Name
                </label>
                <Input id="sp-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-code">
                  Code
                </label>
                <Input id="sp-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-[var(--control-height)]" />
              </div>
              <div>
                <label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-name">
                  Name
                </label>
                <Input id="sp-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" />
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-status">
                Status
              </label>
              <select
                id="sp-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as SavingsProductStatus)}
                className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-min-balance">
                Minimum balance
              </label>
              <Input id="sp-min-balance" value={minBalance} onChange={(event) => setMinBalance(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-rate">
                Interest rate (%)
              </label>
              <Input id="sp-rate" value={interestRate} onChange={(event) => setInterestRate(event.target.value)} className="h-[var(--control-height)]" />
            </div>
          </div>

          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-frequency">
              Interest payout frequency
            </label>
            <Input id="sp-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value)} className="h-[var(--control-height)]" />
          </div>

          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="sp-description">
              Description
            </label>
            <textarea
              id="sp-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] py-[var(--space-8)] fs-text"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="flex items-center gap-2 fs-text text-strong">
              <input type="checkbox" checked={allowedAsGuarantor} onChange={(event) => setAllowedAsGuarantor(event.target.checked)} />
              Allowed as guarantor
            </label>
            <label className="flex items-center gap-2 fs-text text-strong">
              <input type="checkbox" checked={allowedAsCollateral} onChange={(event) => setAllowedAsCollateral(event.target.checked)} />
              Allowed as collateral
            </label>
            <label className="flex items-center gap-2 fs-text text-strong">
              <input type="checkbox" checked={allowedMultipleAccounts} onChange={(event) => setAllowedMultipleAccounts(event.target.checked)} />
              Allowed multiple accounts
            </label>
            <label className="flex items-center gap-2 fs-text text-strong">
              <input type="checkbox" checked={allowInterestPayout} onChange={(event) => setAllowInterestPayout(event.target.checked)} />
              Allow interest payout
            </label>
          </div>

          <FormError message={saveError} />
          <SuccessNote message={saved} />

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
              {saving ? "Saving..." : editing ? "Save changes" : "Create savings product"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/products/savings">Cancel</Link>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
