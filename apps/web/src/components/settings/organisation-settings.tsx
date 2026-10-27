"use client";

import { useEffect, useState } from "react";
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

  const [logoUrlDraft, setLogoUrlDraft] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoNote, setLogoNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getOrganisation()
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setForm(formFrom(next));
        setLogoUrlDraft(externalLogo(next));
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
    setLogoUrlDraft(externalLogo(next));
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
    } catch (failure) {
      setSaveError(message(failure, "Could not save organisation settings."));
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File | undefined) {
    if (!file || logoBusy) return;
    setLogoError(null);
    setLogoNote(null);

    if (!LOGO_TYPES.includes(file.type)) {
      setLogoError("Choose a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Logo must be 48 KB or smaller.");
      return;
    }

    setLogoBusy(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const next = await uploadOrganisationLogo(dataUrl);
      applyData(next);
      setLogoNote("Logo uploaded.");
    } catch (failure) {
      setLogoError(message(failure, "Could not upload the logo."));
    } finally {
      setLogoBusy(false);
    }
  }

  async function applyLogoUrl() {
    if (logoBusy) return;
    const value = logoUrlDraft.trim();
    setLogoError(null);
    setLogoNote(null);

    if (!value) {
      setLogoError("Enter an absolute http or https image URL.");
      return;
    }
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setLogoError("Logo URL must use http or https.");
        return;
      }
    } catch {
      setLogoError("Enter an absolute http or https image URL.");
      return;
    }

    setLogoBusy(true);
    try {
      const next = await updateOrganisation({ logoUrl: value });
      applyData(next);
      setLogoNote("External logo URL saved.");
    } catch (failure) {
      setLogoError(message(failure, "Could not save the logo URL."));
    } finally {
      setLogoBusy(false);
    }
  }

  async function removeLogo() {
    if (logoBusy) return;
    setLogoError(null);
    setLogoNote(null);
    setLogoBusy(true);
    try {
      const next = await deleteOrganisationLogo();
      applyData(next);
      setLogoNote("Logo removed. The header uses the default institution mark.");
    } catch (failure) {
      setLogoError(message(failure, "Could not remove the logo."));
    } finally {
      setLogoBusy(false);
    }
  }

  const preview = apiAssetUrl(data?.logoUrl);
  const logoSource = data?.logoUpdatedAt
    ? "Uploaded image"
    : data?.logoUrl
      ? "External image"
      : "Default mark in the header";

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

            <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
              <header className="border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
                <h2 className="flex items-center gap-2 text-fs font-bold text-strong">
                  <ImageUp className="size-4 text-brand" aria-hidden="true" />
                  Institution logo
                </h2>
                <p className="mt-1 text-fs text-muted-foreground">
                  The header shows this logo at 28px tall. It is never cropped into a circle, so
                  wide lockups keep their proportions.
                </p>
              </header>

              <div className="grid gap-[var(--space-14)] px-[var(--space-16)] py-[var(--space-14)] md:grid-cols-[190px_minmax(0,1fr)]">
                <div>
                  <div className="flex h-[58px] items-center justify-center rounded-[var(--control-radius)] border border-dashed border-card-border bg-subtle px-[var(--space-10)]">
                    {preview ? (
                      <InstitutionLogo
                        src={preview}
                        alt={`${data.name} logo`}
                        monogram={data.code.slice(0, 3).toUpperCase()}
                        width={300}
                        height={43}
                        className="h-7 max-w-[170px]"
                      />
                    ) : (
                      <span className="text-fs text-muted-foreground">No logo</span>
                    )}
                  </div>
                  <p className="mt-1 text-fs text-muted-foreground">{logoSource}</p>
                </div>

                <div className="space-y-[var(--space-10)]">
                  <div>
                    <label
                      htmlFor="org-logo-file"
                      className="mb-1 block text-fs font-medium text-strong"
                    >
                      Upload image
                    </label>
                    <Input
                      id="org-logo-file"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={!data.canEdit || logoBusy}
                      onChange={(event) => {
                        void uploadLogo(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                      className="h-auto py-1.5"
                    />
                    <p className="mt-1 text-fs text-muted-foreground">
                      PNG, JPEG or WebP, 48 KB or smaller. Uploading replaces any external URL.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="org-logo-url"
                      className="mb-1 block text-fs font-medium text-strong"
                    >
                      External image URL
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        id="org-logo-url"
                        value={logoUrlDraft}
                        placeholder="https://example.com/logo.png"
                        disabled={!data.canEdit || logoBusy}
                        onChange={(event) => {
                          setLogoUrlDraft(event.target.value);
                          setLogoError(null);
                          setLogoNote(null);
                        }}
                        className="min-w-[180px] flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!data.canEdit || logoBusy}
                        onClick={() => void applyLogoUrl()}
                      >
                        Use URL
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!data.canEdit || logoBusy || !data.logoUrl}
                        onClick={() => void removeLogo()}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Remove
                      </Button>
                    </div>
                    <p className="mt-1 text-fs text-muted-foreground">
                      A public https URL. Saving it clears any uploaded image.
                    </p>
                  </div>

                  <FormError message={logoError} />
                  <SuccessNote message={logoNote} />
                  {logoBusy ? (
                    <p className="text-fs text-muted-foreground" role="status">
                      Updating logo…
                    </p>
                  ) : null}
                </div>
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
