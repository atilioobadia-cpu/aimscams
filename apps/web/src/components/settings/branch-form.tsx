"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Clock3, Lock, MapPin, Save, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ErrorPanel,
  ForbiddenPanel,
  FormError,
  PanelSkeleton,
  SuccessNote,
} from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import {
  COUNCIL_TYPES,
  WEEKDAYS,
  createBranch,
  defaultBranchHours,
  dayLabel,
  getBranch,
  listBranches,
  minutesToTime,
  normaliseHours,
  timeToMinutes,
  updateBranch,
  type Branch,
  type BranchHour,
  type BranchPayload,
  type BranchStatus,
  type CouncilType,
} from "@/lib/settings";

type BranchFormMode = "create" | "edit";

type BranchFormState = {
  name: string;
  code: string;
  addressLine: string;
  region: string;
  district: string;
  ward: string;
  councilType: "" | CouncilType;
  employeeCount: string;
  status: BranchStatus;
  isDefault: boolean;
  hours: BranchHour[];
};

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function emptyForm(isFirst: boolean): BranchFormState {
  return {
    name: "",
    code: "",
    addressLine: "",
    region: "",
    district: "",
    ward: "",
    councilType: "",
    employeeCount: "0",
    status: "OPEN",
    isDefault: isFirst,
    hours: defaultBranchHours(),
  };
}

function formFromBranch(branch: Branch): BranchFormState {
  return {
    name: branch.name,
    code: branch.code,
    addressLine: branch.addressLine ?? "",
    region: branch.region,
    district: branch.district ?? "",
    ward: branch.ward ?? "",
    councilType: branch.councilType ?? "",
    employeeCount: String(branch.employeeCount),
    status: branch.status,
    isDefault: branch.isDefault,
    hours: normaliseHours(branch.hours),
  };
}

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function validate(form: BranchFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Branch name is required.";
  if (!/^[A-Z0-9][A-Z0-9-]{1,9}$/.test(form.code.trim().toUpperCase())) {
    errors.code = "Code must be 2 to 10 letters, digits or hyphens.";
  }
  if (!form.region.trim()) errors.region = "Region is required.";

  const employees = Number(form.employeeCount);
  if (
    form.employeeCount.trim() === "" ||
    !Number.isInteger(employees) ||
    employees < 0 ||
    employees > 100000
  ) {
    errors.employeeCount = "Employees must be a whole number between 0 and 100000.";
  }

  if (form.isDefault && form.status === "CLOSED") {
    errors.status = "The default branch must stay open.";
  }

  const invalidDay = form.hours.find(
    (hour) => !hour.isClosed && hour.closesMinute <= hour.opensMinute,
  );
  if (invalidDay) {
    errors.hours = `Closing time on ${dayLabel(invalidDay.weekday)} must be after opening time.`;
  }

  return errors;
}

export function BranchFormPage({ mode, branchId }: { mode: BranchFormMode; branchId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [branch, setBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchFormState | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (mode === "create") {
          const list = await listBranches();
          if (cancelled) return;
          if (!list.canCreate) {
            setForbidden(true);
            return;
          }
          setCanEdit(true);
          setForm(emptyForm(list.items.length === 0));
        } else {
          const response = await getBranch(branchId ?? "");
          if (cancelled) return;
          setBranch(response.branch);
          setCanEdit(response.canEdit);
          setForm(formFromBranch(response.branch));
        }
      } catch (failure) {
        if (cancelled) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setForbidden(true);
        } else if (failure instanceof ApiError && failure.status === 404) {
          setNotFound(true);
        } else {
          setError(message(failure, "Could not load this branch."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [mode, branchId, reloadKey]);

  function retry() {
    setLoading(true);
    setError(null);
    setForbidden(false);
    setNotFound(false);
    setReloadKey((value) => value + 1);
  }

  function update(patch: Partial<BranchFormState>) {
    setForm((current) => (current ? { ...current, ...patch } : current));
    setSaved(null);
  }

  function updateHour(weekday: number, patch: Partial<BranchHour>) {
    setForm((current) =>
      current
        ? {
            ...current,
            hours: current.hours.map((hour) =>
              hour.weekday === weekday ? { ...hour, ...patch } : hour,
            ),
          }
        : current,
    );
    setSaved(null);
  }

  function toggleClosed(weekday: number, closed: boolean) {
    if (closed) {
      updateHour(weekday, { isClosed: true, opensMinute: 0, closesMinute: 0 });
    } else {
      updateHour(weekday, {
        isClosed: false,
        opensMinute: 8 * 60,
        closesMinute: 17 * 60,
      });
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !canEdit || saving) return;

    const errors = validate(form);
    setFieldErrors(errors);
    setSaveError(null);
    setSaved(null);
    if (Object.keys(errors).length > 0) return;

    const payload: BranchPayload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      addressLine: optional(form.addressLine),
      region: form.region.trim(),
      district: optional(form.district),
      ward: optional(form.ward),
      councilType: form.councilType || null,
      employeeCount: Number(form.employeeCount),
      status: form.status,
      isDefault: form.isDefault,
      hours: normaliseHours(form.hours),
    };

    setSaving(true);
    try {
      if (mode === "create") {
        const response = await createBranch(payload);
        router.push(`/settings/branches/${response.branch.id}`);
        router.refresh();
        return;
      }
      const response = await updateBranch(branchId ?? "", payload);
      setBranch(response.branch);
      setForm(formFromBranch(response.branch));
      setCanEdit(response.canEdit);
      setSaved("Branch saved.");
      router.refresh();
    } catch (failure) {
      setSaveError(message(failure, "Could not save this branch."));
    } finally {
      setSaving(false);
    }
  }

  const title = mode === "create" ? "Add branch" : (branch?.name ?? "Branch");
  const description =
    mode === "create"
      ? "Create a branch so members, users and transactions can be scoped to it."
      : "Address, council classification and weekly opening hours for this branch.";

  const errorList = Object.values(fieldErrors);

  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title={title}
        description={description}
        breadcrumb={
          <span className="flex items-center gap-1">
            <Link href="/settings/general" className="hover:text-brand hover:underline">
              Settings
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/settings/branches" className="hover:text-brand hover:underline">
              Branches
            </Link>
          </span>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/settings/branches">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to branches
            </Link>
          </Button>
        }
      />

      {forbidden ? (
        <ForbiddenPanel
          message={
            mode === "create"
              ? "Your role cannot create branches. Ask an administrator for Settings Branch : Create."
              : "Your role cannot view this branch. Ask an administrator for Settings Branch : View."
          }
        />
      ) : loading ? (
        <PanelSkeleton rows={11} />
      ) : notFound ? (
        <EmptyState
          icon={Building2}
          title="Branch not found"
          description="This branch does not exist in this institution, or it was removed."
          action={
            <Button asChild variant="outline">
              <Link href="/settings/branches">Back to branches</Link>
            </Button>
          }
        />
      ) : error ? (
        <ErrorPanel message={error} onRetry={retry} />
      ) : form ? (
        <form
          id="branch-form"
          noValidate
          className="space-y-[var(--space-14)]"
          onSubmit={(event) => void save(event)}
        >
          {!canEdit ? (
            <div className="flex items-start gap-[var(--space-10)] rounded-[var(--card-radius)] border border-card-border bg-subtle px-[var(--space-14)] py-[var(--space-10)]">
              <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p className="text-fs text-muted-foreground">
                Your role can view this branch but not change it. Ask an administrator for Settings
                Branch : Edit.
              </p>
            </div>
          ) : null}

          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
            <header className="border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
              <h2 className="flex items-center gap-2 text-fs font-bold text-strong">
                <Building2 className="size-4 text-brand" aria-hidden="true" />
                Branch details
              </h2>
              <p className="mt-1 text-fs text-muted-foreground">
                The code is the short identifier printed on receipts and used in reports.
              </p>
            </header>

            <div className="grid gap-[var(--space-12)] px-[var(--space-16)] py-[var(--space-14)] sm:grid-cols-2 xl:grid-cols-3">
              <div className="sm:col-span-2 xl:col-span-1">
                <label htmlFor="branch-name" className="mb-1 block text-fs font-medium text-strong">
                  Branch name
                </label>
                <Input
                  id="branch-name"
                  value={form.name}
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.name)}
                  disabled={!canEdit || saving}
                  onChange={(event) => update({ name: event.target.value })}
                />
              </div>

              <div>
                <label htmlFor="branch-code" className="mb-1 block text-fs font-medium text-strong">
                  Branch code
                </label>
                <Input
                  id="branch-code"
                  value={form.code}
                  maxLength={10}
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.code)}
                  disabled={!canEdit || saving}
                  onChange={(event) => update({ code: event.target.value.toUpperCase() })}
                />
                <p className="mt-1 text-fs text-muted-foreground">
                  2–10 letters, digits or hyphens.
                </p>
              </div>

              <div>
                <label
                  htmlFor="branch-status"
                  className="mb-1 block text-fs font-medium text-strong"
                >
                  Status
                </label>
                <select
                  id="branch-status"
                  value={form.status}
                  aria-invalid={Boolean(fieldErrors.status)}
                  disabled={!canEdit || saving}
                  onChange={(event) => update({ status: event.target.value as BranchStatus })}
                  className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-fs text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="sm:col-span-2 xl:col-span-3">
                <label className="flex items-start gap-2 text-fs">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    disabled={!canEdit || saving || branch?.isDefault}
                    onChange={(event) => update({ isDefault: event.target.checked })}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span>
                    <span className="font-medium text-strong">Default branch</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      {branch?.isDefault
                        ? "This is the current default. Promote another branch before clearing the flag."
                        : mode === "create"
                          ? "The network default must stay open. If this is the first branch, it becomes the default automatically."
                          : "Promote this branch to be the network default. The previous default becomes a normal branch."}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
            <header className="border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
              <h2 className="flex items-center gap-2 text-fs font-bold text-strong">
                <MapPin className="size-4 text-brand" aria-hidden="true" />
                Location and council
              </h2>
              <p className="mt-1 text-fs text-muted-foreground">
                The ward and council type describe the local government area the branch serves.
              </p>
            </header>

            <div className="grid gap-[var(--space-12)] px-[var(--space-16)] py-[var(--space-14)] sm:grid-cols-2 xl:grid-cols-3">
              <div className="sm:col-span-2 xl:col-span-3">
                <label
                  htmlFor="branch-address"
                  className="mb-1 block text-fs font-medium text-strong"
                >
                  Street address
                </label>
                <Input
                  id="branch-address"
                  value={form.addressLine}
                  disabled={!canEdit || saving}
                  onChange={(event) => update({ addressLine: event.target.value })}
                />
              </div>

              <div>
                <label
                  htmlFor="branch-region"
                  className="mb-1 block text-fs font-medium text-strong"
                >
                  Region
                </label>
                <Input
                  id="branch-region"
                  value={form.region}
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.region)}
                  disabled={!canEdit || saving}
                  onChange={(event) => update({ region: event.target.value })}
                />
              </div>

              <div>
                <label
                  htmlFor="branch-district"
                  className="mb-1 block text-fs font-medium text-strong"
                >
                  District
                </label>
                <Input
                  id="branch-district"
                  value={form.district}
                  disabled={!canEdit || saving}
                  onChange={(event) => update({ district: event.target.value })}
                />
              </div>

              <div>
                <label htmlFor="branch-ward" className="mb-1 block text-fs font-medium text-strong">
                  Ward
                </label>
                <Input
                  id="branch-ward"
                  value={form.ward}
                  disabled={!canEdit || saving}
                  onChange={(event) => update({ ward: event.target.value })}
                />
              </div>

              <div>
                <label
                  htmlFor="branch-council"
                  className="mb-1 block text-fs font-medium text-strong"
                >
                  Council type
                </label>
                <select
                  id="branch-council"
                  value={form.councilType}
                  disabled={!canEdit || saving}
                  onChange={(event) =>
                    update({ councilType: event.target.value as "" | CouncilType })
                  }
                  className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-fs text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Not recorded</option>
                  {COUNCIL_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="branch-employees"
                  className="mb-1 block text-fs font-medium text-strong"
                >
                  Employees
                </label>
                <Input
                  id="branch-employees"
                  type="number"
                  min={0}
                  max={100000}
                  step={1}
                  value={form.employeeCount}
                  aria-invalid={Boolean(fieldErrors.employeeCount)}
                  disabled={!canEdit || saving}
                  onChange={(event) => update({ employeeCount: event.target.value })}
                />
                <p className="mt-1 flex items-center gap-1 text-fs text-muted-foreground">
                  <Users className="size-3.5" aria-hidden="true" />
                  Headcount at this branch, not user accounts.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
            <header className="border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
              <h2 className="flex items-center gap-2 text-fs font-bold text-strong">
                <Clock3 className="size-4 text-brand" aria-hidden="true" />
                Opening hours
              </h2>
              <p className="mt-1 text-fs text-muted-foreground">
                One row per weekday. Closed days store no times; closing time must be after opening
                time.
              </p>
            </header>

            <div className="overflow-x-auto px-[var(--space-16)] py-[var(--space-14)]">
              <table className="w-full min-w-[520px] text-fs">
                <thead>
                  <tr className="border-b border-card-border text-left text-fs font-semibold uppercase tracking-wide text-label">
                    <th className="py-[var(--space-8)] pr-[var(--space-10)]">Day</th>
                    <th className="px-[var(--space-10)] py-[var(--space-8)]">Closed</th>
                    <th className="px-[var(--space-10)] py-[var(--space-8)]">Opens</th>
                    <th className="px-[var(--space-10)] py-[var(--space-8)]">Closes</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEKDAYS.map((day) => {
                    const hour = form.hours.find((item) => item.weekday === day.value);
                    if (!hour) return null;
                    return (
                      <tr key={day.value} className="border-b border-card-border last:border-0">
                        <th
                          scope="row"
                          className="py-[var(--space-8)] pr-[var(--space-10)] text-left font-medium text-strong"
                        >
                          {day.label}
                        </th>
                        <td className="px-[var(--space-10)] py-[var(--space-8)]">
                          <input
                            type="checkbox"
                            checked={hour.isClosed}
                            disabled={!canEdit || saving}
                            aria-label={`Closed on ${day.label}`}
                            onChange={(event) => toggleClosed(day.value, event.target.checked)}
                            className="size-4 accent-primary"
                          />
                        </td>
                        <td className="px-[var(--space-10)] py-[var(--space-8)]">
                          <Input
                            type="time"
                            aria-label={`${day.label} opening time`}
                            value={hour.isClosed ? "" : minutesToTime(hour.opensMinute)}
                            disabled={!canEdit || saving || hour.isClosed}
                            onChange={(event) =>
                              updateHour(day.value, {
                                opensMinute: timeToMinutes(event.target.value),
                              })
                            }
                            className="max-w-[140px]"
                          />
                        </td>
                        <td className="px-[var(--space-10)] py-[var(--space-8)]">
                          <Input
                            type="time"
                            aria-label={`${day.label} closing time`}
                            value={hour.isClosed ? "" : minutesToTime(hour.closesMinute)}
                            disabled={!canEdit || saving || hour.isClosed}
                            onChange={(event) =>
                              updateHour(day.value, {
                                closesMinute: timeToMinutes(event.target.value),
                              })
                            }
                            className="max-w-[140px]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
            <div className="flex flex-wrap items-start justify-between gap-[var(--space-12)] px-[var(--space-16)] py-[var(--space-12)]">
              <div className="min-w-0 space-y-1">
                <FormError message={saveError} />
                <SuccessNote message={saved} />
                {errorList.length > 0 ? (
                  <ul role="alert" className="space-y-1 text-fs text-accent-red">
                    {errorList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {saveError || errorList.length > 0 ? null : (
                  <p className="text-fs text-muted-foreground">
                    {mode === "create"
                      ? "The branch is created immediately and can be edited afterwards."
                      : branch?.updatedAt
                        ? `Last updated ${branch.updatedAt.slice(0, 10)}.`
                        : "Changes are recorded in the audit log."}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button asChild variant="outline">
                  <Link href="/settings/branches">Cancel</Link>
                </Button>
                {canEdit ? (
                  <Button type="submit" disabled={saving}>
                    <Save className="size-4" aria-hidden="true" />
                    {saving ? "Saving" : mode === "create" ? "Create branch" : "Save branch"}
                  </Button>
                ) : null}
              </div>
            </div>
          </section>
        </form>
      ) : null}
    </div>
  );
}
