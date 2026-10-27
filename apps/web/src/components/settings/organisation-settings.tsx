"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Globe2, ImageUp, Info, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { InstitutionLogo } from "@/components/brand/institution-logo";
import {
  ErrorPanel,
  ForbiddenPanel,
  FormError,
  PanelSkeleton,
  SuccessNote,
} from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError, apiAssetUrl } from "@/lib/api";
import {
  COMMON_TIMEZONES,
  deleteOrganisationLogo,
  getOrganisation,
  updateOrganisation,
  uploadOrganisationLogo,
  type InstitutionDialect,
  type OrganisationSettings,
} from "@/lib/settings";

const MAX_LOGO_BYTES = 48 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

type OrganisationForm = {
  name: string;
  registrationNo: string;
  dialect: InstitutionDialect;
  timezone: string;
  defaultBranchId: string;
};

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function formFrom(data: OrganisationSettings): OrganisationForm {
  return {
    name: data.name,
    registrationNo: data.registrationNo ?? "",
    dialect: data.dialect,
    timezone: data.timezone,
    defaultBranchId: data.defaultBranchId ?? "",
  };
}

function externalLogo(data: OrganisationSettings): string {
  return data.logoUrl && /^https?:\/\//i.test(data.logoUrl) ? data.logoUrl : "";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read that file."));
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function updatedLabel(iso: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toISOString().slice(0, 10);
  }
}

export function OrganisationSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pushToast } = useToast();
  const router = useRouter();
  const [data, setData] = useState<OrganisationSettings | null>(null);
  const [form, setForm] = useState<OrganisationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);


  useEffect(() => {
    let cancelled = false;

    void getOrganisation()
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setForm(formFrom(next));
      })
      .catch((failure: unknown) => {
        if (cancelled) return;
        if (failure instanceof ApiError && failure.status === 403) {
          setForbidden(true);
        } else {
          setError(message(failure, "Could not load organisation settings."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retry() {
    setLoading(true);
    setError(null);
    setForbidden(false);
    setReloadKey((value) => value + 1);
  }

  function applyData(next: OrganisationSettings) {
    setData(next);
    setForm(formFrom(next));
    router.refresh();
  }

  async function saveOrganisation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !data?.canEdit || saving) return;

    if (!form.name.trim()) {
      setSaveError("Legal name is required.");
      return;
    }
    if (!form.timezone.trim()) {
      setSaveError("Time zone is required.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaved(null);
    try {
      const next = await updateOrganisation({
        name: form.name.trim(),
        registrationNo: form.registrationNo.trim() || null,
        dialect: form.dialect,
        timezone: form.timezone.trim(),
        ...(form.defaultBranchId ? { defaultBranchId: form.defaultBranchId } : {}),
      });
      applyData(next);
      setSaved("Organisation settings saved.");
      pushToast("Organisation settings saved.");
    } catch (failure) {
      setSaveError(message(failure, "Could not save organisation settings."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-[var(--space-14)]">
      <PageHeader
        title="General"
        description="The institution's legal identity, branding and operating defaults."
        breadcrumb="Settings"
      />

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view organisation settings. Ask an administrator for Settings Organisation : View." />
      ) : loading ? (
        <PanelSkeleton rows={10} />
      ) : error ? (
        <ErrorPanel message={error} onRetry={retry} />
      ) : data && form ? (
        <div className="grid items-start gap-[var(--space-14)] xl:grid-cols-[minmax(0,1fr)_360px]">
          <form
            noValidate
            className="space-y-[var(--space-14)]"
            onSubmit={(event) => void saveOrganisation(event)}
          >
            <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
              <header className="border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
                <h2 className="flex items-center gap-2 text-fs font-bold text-strong">
                  <Building2 className="size-4 text-brand" aria-hidden="true" />
                  Institution identity
                </h2>
                <p className="mt-1 text-fs text-muted-foreground">
                  One installation serves one institution. These values identify the tenant in
                  reports, receipts and the application header.
                </p>
              </header>

              <div className="grid gap-[var(--space-12)] px-[var(--space-16)] py-[var(--space-14)] sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="org-name" className="mb-1 block text-fs font-medium text-strong">
                    Legal name
                  </label>
                  <Input
                    id="org-name"
                    value={form.name}
                    required
                    disabled={!data.canEdit || saving}
                    onChange={(event) => {
                      setForm({ ...form, name: event.target.value });
                      setSaved(null);
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="org-registration"
                    className="mb-1 block text-fs font-medium text-strong"
                  >
                    Registration number
                  </label>
                  <Input
                    id="org-registration"
                    value={form.registrationNo}
                    placeholder="e.g. 2019/0142"
                    disabled={!data.canEdit || saving}
                    onChange={(event) => {
                      setForm({ ...form, registrationNo: event.target.value });
                      setSaved(null);
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="org-dialect"
                    className="mb-1 block text-fs font-medium text-strong"
                  >
                    Board dialect
                  </label>
                  <select
                    id="org-dialect"
                    value={form.dialect}
                    disabled={!data.canEdit || saving}
                    onChange={(event) => {
                      setForm({ ...form, dialect: event.target.value as InstitutionDialect });
                      setSaved(null);
                    }}
                    className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-fs text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="TCDC">
                      TCDC — Tanzania Co-operative Development Commission
                    </option>
                    <option value="BOT">BOT — Bank of Tanzania</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="org-timezone"
                    className="mb-1 block text-fs font-medium text-strong"
                  >
                    Time zone
                  </label>
                  <Input
                    id="org-timezone"
                    value={form.timezone}
                    list="organisation-timezones"
                    required
                    disabled={!data.canEdit || saving}
                    onChange={(event) => {
                      setForm({ ...form, timezone: event.target.value });
                      setSaved(null);
                    }}
                  />
                  <datalist id="organisation-timezones">
                    {COMMON_TIMEZONES.map((zone) => (
                      <option key={zone} value={zone} />
                    ))}
                  </datalist>
                  <p className="mt-1 text-fs text-muted-foreground">
                    IANA zone used for dates on reports and schedules.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="org-default-branch"
                    className="mb-1 block text-fs font-medium text-strong"
                  >
                    Default branch
                  </label>
                  <select
                    id="org-default-branch"
                    value={form.defaultBranchId}
                    disabled={!data.canEdit || saving || data.branches.length === 0}
                    onChange={(event) => {
                      setForm({ ...form, defaultBranchId: event.target.value });
                      setSaved(null);
                    }}
                    className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] text-fs text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {data.branches.length === 0 ? <option value="">No branches yet</option> : null}
                    {data.branches.map((branch) => (
                      <option key={branch.id} value={branch.id} disabled={branch.status !== "OPEN"}>
                        {branch.name} ({branch.code}){branch.status !== "OPEN" ? " — closed" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-fs text-muted-foreground">
                    The default branch must stay open. Change it here, not in the branch form.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-[var(--space-10)] border-t border-chrome px-[var(--space-16)] py-[var(--space-12)]">
                <div className="min-w-0">
                  <FormError message={saveError} />
                  <SuccessNote message={saved} />
                  {!data.canEdit ? (
                    <p className="text-fs text-muted-foreground">
                      Your role can view these settings but not change them.
                    </p>
                  ) : null}
                </div>
                {data.canEdit ? (
                  <Button type="submit" disabled={saving}>
                    <Save className="size-4" aria-hidden="true" />
                    {saving ? "Saving" : "Save changes"}
                  </Button>
                ) : null}
              </div>
            </section>

          </form>

          <aside className="space-y-[var(--space-14)]">
            <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
              <header className="border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
                <h2 className="flex items-center gap-2 text-fs font-bold text-strong">
                  <Globe2 className="size-4 text-brand" aria-hidden="true" />
                  Installation
                </h2>
              </header>
              <dl className="grid gap-[var(--space-10)] px-[var(--space-16)] py-[var(--space-14)]">
                <div className="flex items-start justify-between gap-[var(--space-10)]">
                  <dt className="text-fs text-muted-foreground">Institution code</dt>
                  <dd className="text-fs font-semibold text-strong">{data.code}</dd>
                </div>
                <div className="flex items-start justify-between gap-[var(--space-10)]">
                  <dt className="text-fs text-muted-foreground">Locale</dt>
                  <dd className="text-fs font-semibold text-strong">{data.locale}</dd>
                </div>
                <div className="flex items-start justify-between gap-[var(--space-10)]">
                  <dt className="text-fs text-muted-foreground">Branches</dt>
                  <dd className="text-fs font-semibold text-strong">{data.branches.length}</dd>
                </div>
                <div className="flex items-start justify-between gap-[var(--space-10)]">
                  <dt className="text-fs text-muted-foreground">Last updated</dt>
                  <dd className="text-right text-fs font-semibold text-strong">
                    {updatedLabel(data.updatedAt, data.timezone)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[var(--card-radius)] border border-card-border bg-subtle">
              <div className="flex gap-[var(--space-10)] px-[var(--space-16)] py-[var(--space-14)]">
                <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <h2 className="text-fs font-bold text-strong">One tenant per installation</h2>
                  <p className="mt-1 text-fs leading-[1.45] text-muted-foreground">
                    The legal name, registration number and time zone apply to every branch.
                    Branch-specific addresses and hours live under Branches.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
