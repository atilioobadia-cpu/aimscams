"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Building2, Palette, RotateCcw, Save, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  ErrorPanel,
  ForbiddenPanel,
  FormError,
  PanelSkeleton,
  SuccessNote,
} from "@/components/accounting/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import {
  APPEARANCE_COLORS,
  DEFAULT_APPEARANCE,
  presetColor,
  readAppearancePreferences,
  saveAppearancePreferences,
  subscribeAppearancePreferences,
  type AppearancePreferences,
  type AppearancePreset,
} from "@/lib/appearance";
import {
  COMMON_TIMEZONES,
  getOrganisation,
  updateOrganisation,
  type InstitutionDialect,
  type OrganisationSettings,
} from "@/lib/settings";

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
  const [activeTab, setActiveTab] = useState<"info" | "security" | "appearance">("info");
  const [editingInfo, setEditingInfo] = useState(false);
  const savedAppearance = useSyncExternalStore(
    subscribeAppearancePreferences,
    readAppearancePreferences,
    () => DEFAULT_APPEARANCE,
  );
  const [appearanceDraft, setAppearanceDraft] = useState(DEFAULT_APPEARANCE);
  const [appearanceDirty, setAppearanceDirty] = useState(false);
  const appearance = appearanceDirty ? appearanceDraft : savedAppearance;


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
    setEditingInfo(false);
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
      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
        <header className="flex items-center gap-3 px-[var(--space-16)] py-[var(--space-16)]">
          <Wrench className="size-5 text-brand" aria-hidden="true" />
          <div>
            <h1 className="fs-title font-bold text-strong">General</h1>
            <p className="fs-text text-muted-foreground">General Settings</p>
          </div>
        </header>
      </section>
      <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
        <div role="tablist" aria-label="General settings sections" className="flex bg-white text-heading">
          <button type="button" role="tab" id="general-info-tab" aria-selected={activeTab === "info"} aria-controls="general-info-panel" onClick={() => setActiveTab("info")} className={`min-h-10 border-b-2 px-4 fs-text font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === "info" ? "border-primary bg-surface text-primary" : "border-transparent text-muted-foreground hover:text-strong"}`}>
            Info
          </button>
          <button type="button" role="tab" id="general-security-tab" aria-selected={activeTab === "security"} aria-controls="general-security-panel" onClick={() => setActiveTab("security")} className={`min-h-10 border-b-2 px-4 fs-text font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === "security" ? "border-primary bg-surface text-primary" : "border-transparent text-muted-foreground hover:text-strong"}`}>
            Security
          </button>
          <button type="button" role="tab" id="general-appearance-tab" aria-selected={activeTab === "appearance"} aria-controls="general-appearance-panel" onClick={() => setActiveTab("appearance")} className={`min-h-10 border-b-2 px-4 fs-text font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === "appearance" ? "border-primary bg-surface text-primary" : "border-transparent text-muted-foreground hover:text-strong"}`}>
            Appearance
          </button>
        </div>
      </section>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view organisation settings. Ask an administrator for Settings Organisation : View." />
      ) : loading ? (
        <PanelSkeleton rows={10} />
      ) : error ? (
        <ErrorPanel message={error} onRetry={retry} />
      ) : data && form && activeTab === "info" ? (
        <div id="general-info-panel" role="tabpanel" aria-labelledby="general-info-tab" className="space-y-[var(--space-14)]">
          {!editingInfo ? (
            <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
                <h2 className="fs-text font-bold text-strong">Institution information</h2>
                {data.canEdit ? <Button type="button" variant="outline" size="sm" onClick={() => setEditingInfo(true)}>Edit</Button> : null}
              </div>
              <dl className="grid gap-x-8 gap-y-4 px-[var(--space-16)] py-[var(--space-14)] sm:grid-cols-2 lg:grid-cols-3">
                <InfoField label="Institution name" value={data.name} />
                <InfoField label="Registration number" value={data.registrationNo || "N/A"} />
                <InfoField label="Board dialect" value={data.dialect} />
                <InfoField label="Time zone" value={data.timezone} />
                <InfoField label="Default branch" value={data.branches.find((branch) => branch.id === data.defaultBranchId)?.name ?? "N/A"} />
                <InfoField label="Institution code" value={data.code} />
                <InfoField label="Locale" value={data.locale} />
                <InfoField label="Branch count" value={String(data.branches.length)} />
                <InfoField label="Transaction PIN" value="Not available" />
                <InfoField label="Last updated" value={updatedLabel(data.updatedAt, data.timezone)} />
              </dl>
            </section>
          ) : null}
          <form
            noValidate
            className={`space-y-[var(--space-14)] ${editingInfo ? "" : "hidden"}`}
            onSubmit={(event) => void saveOrganisation(event)}
          >
            <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
              <header className="border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
                <h2 className="flex items-center gap-2 fs-text font-bold text-strong">
                  <Building2 className="size-4 text-brand" aria-hidden="true" />
                  Institution identity
                </h2>
                <p className="mt-1 fs-text text-muted-foreground">
                  One installation serves one institution. These values identify the tenant in
                  reports, receipts and the application header.
                </p>
              </header>

              <div className="grid gap-[var(--space-12)] px-[var(--space-16)] py-[var(--space-14)] sm:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-3">
                  <label htmlFor="org-name" className="mb-1 block fs-text font-medium text-strong">
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
                    className="mb-1 block fs-text font-medium text-strong"
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
                    className="mb-1 block fs-text font-medium text-strong"
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
                    className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="mb-1 block fs-text font-medium text-strong"
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
                  <p className="mt-1 fs-text text-muted-foreground">
                    IANA zone used for dates on reports and schedules.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="org-default-branch"
                    className="mb-1 block fs-text font-medium text-strong"
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
                    className="h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-input bg-background px-[var(--space-12)] fs-text text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {data.branches.length === 0 ? <option value="">No branches yet</option> : null}
                    {data.branches.map((branch) => (
                      <option key={branch.id} value={branch.id} disabled={branch.status !== "OPEN"}>
                        {branch.name} ({branch.code}){branch.status !== "OPEN" ? " — closed" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 fs-text text-muted-foreground">
                    The default branch must stay open. Change it here, not in the branch form.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-[var(--space-10)] border-t border-chrome px-[var(--space-16)] py-[var(--space-12)]">
                <div className="min-w-0">
                  <FormError message={saveError} />
                  <SuccessNote message={saved} />
                  {!data.canEdit ? (
                    <p className="fs-text text-muted-foreground">
                      Your role can view these settings but not change them.
                    </p>
                  ) : null}
                </div>
                {data.canEdit ? <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => { setForm(formFrom(data)); setEditingInfo(false); setSaveError(null); setSaved(null); }} disabled={saving}>Cancel</Button>
                  <Button type="submit" disabled={saving}><Save className="size-4" aria-hidden="true" />{saving ? "Saving" : "Save changes"}</Button>
                </div> : null}
              </div>
            </section>

          </form>

          <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
            <header className="border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
              <h2 className="fs-text font-bold text-strong">Online Collections</h2>
            </header>
            <div className="flex flex-wrap items-start justify-between gap-4 px-[var(--space-16)] py-[var(--space-14)]">
              <div>
                <p className="fs-text font-semibold text-strong">Preferred savings product for online payments</p>
                <p className="mt-1 fs-text text-muted-foreground">Not configured in AIMSCAMS. Online payment routing is not part of the current organisation settings API.</p>
              </div>
              <Button type="button" variant="outline" size="sm" disabled title="Online collection routing is not supported by the local settings API">Edit</Button>
            </div>
          </section>

        </div>
      ) : activeTab === "appearance" ? (
        <div id="general-appearance-panel" role="tabpanel" aria-labelledby="general-appearance-tab" className="space-y-[var(--space-14)]">
          <AppearanceSettings value={appearance} onChange={(next) => {
            setAppearanceDraft(next);
            setAppearanceDirty(true);
          }} />
          <div className="flex flex-wrap items-center gap-[var(--space-10)]">
            <Button type="button" variant="outline" onClick={() => {
              setAppearanceDraft(DEFAULT_APPEARANCE);
              setAppearanceDirty(false);
              saveAppearancePreferences(DEFAULT_APPEARANCE);
              pushToast("Appearance reset to defaults.");
            }}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset to defaults
            </Button>
            <Button type="button" onClick={() => {
              saveAppearancePreferences(appearanceDraft);
              setAppearanceDirty(false);
              pushToast("Appearance settings saved.");
            }} disabled={!appearanceDirty}>
              <Save className="size-4" aria-hidden="true" />
              Save settings
            </Button>
          </div>
        </div>
      ) : activeTab === "security" ? (
        <div id="general-security-panel" role="tabpanel" aria-labelledby="general-security-tab" className="space-y-[var(--space-14)]">
          <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-surface">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
              <h2 className="fs-text font-bold text-strong">Security</h2>
              <Button type="button" variant="outline" size="sm" disabled title="Security management is not available in the local settings API">New Security</Button>
            </header>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="fs-text font-semibold text-strong">{label}</dt>
      <dd className="mt-1 fs-text text-strong">{value}</dd>
    </div>
  );
}

function AppearanceSettings({ value, onChange }: { value: AppearancePreferences; onChange: (value: AppearancePreferences) => void }) {
  const presets: { id: AppearancePreset; label: string; description: string }[] = [
    { id: "mfsl", label: "Wakandi", description: "Teal and white" },
    { id: "blue", label: "Modern", description: "Blue and white" },
    { id: "classic", label: "Classic", description: "Warm neutral accents" },
  ];

  return (
    <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
      <header className="border-b border-chrome px-[var(--space-16)] py-[var(--space-12)]">
        <h2 className="flex items-center gap-2 fs-text font-bold text-strong"><Palette className="size-4 text-brand" aria-hidden="true" />Appearance Settings</h2>
      </header>
      <div className="space-y-[var(--space-18)] px-[var(--space-16)] py-[var(--space-16)]">
        <fieldset className="space-y-2">
          <legend className="fs-text font-semibold text-strong">Theme</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {presets.map((preset) => (
              <button key={preset.id} type="button" aria-pressed={value.preset === preset.id} onClick={() => onChange({ ...value, preset: preset.id, primaryColor: presetColor(preset.id) })} className={`rounded-[var(--card-radius)] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${value.preset === preset.id ? "border-primary bg-primary-tint" : "border-card-border hover:border-primary"}`}>
                <span className="mb-2 block h-9 rounded border border-card-border" style={{ background: `linear-gradient(90deg, ${presetColor(preset.id)} 0 22%, #f8fafc 22% 100%)` }} aria-hidden="true" />
                <span className="block fs-text font-semibold text-strong">{preset.label}</span>
                <span className="block fs-text text-muted-foreground">{preset.description}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-4 border-t border-chrome pt-4">
          <div>
            <p className="fs-text font-semibold text-strong">Dark Mode</p>
            <p className="fs-text text-muted-foreground">Use a dark application surface.</p>
          </div>
          <button type="button" role="switch" aria-checked={value.darkMode} aria-label="Dark mode" onClick={() => onChange({ ...value, darkMode: !value.darkMode })} className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${value.darkMode ? "border-primary bg-primary" : "border-border bg-muted"}`}>
            <span className={`absolute top-0.5 size-[14px] rounded-full bg-surface shadow-sm transition-all ${value.darkMode ? "left-[18px]" : "left-0.5"}`} />
          </button>
        </div>

        <fieldset className="space-y-2 border-t border-chrome pt-4">
          <legend className="fs-text font-semibold text-strong">Primary Color</legend>
          <div className="flex flex-wrap gap-2">
            {APPEARANCE_COLORS.map((color) => (
              <button key={color} type="button" aria-label={`Choose primary color ${color}`} aria-pressed={value.primaryColor === color} onClick={() => onChange({ ...value, primaryColor: color })} className={`size-7 rounded-full border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${value.primaryColor === color ? "scale-110 border-strong" : "border-transparent hover:scale-110"}`} style={{ backgroundColor: color }} />
            ))}
          </div>
        </fieldset>

        <div className="space-y-2 border-t border-chrome pt-4">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="appearance-scale" className="fs-text font-semibold text-strong">UI Scale</label>
            <span className="fs-text text-muted-foreground">{value.scale}/20 · {Math.round(((value.scale - 2) / 18) * 100)}%</span>
          </div>
          <input id="appearance-scale" type="range" min="2" max="20" step="1" value={value.scale} onChange={(event) => onChange({ ...value, scale: Number(event.target.value) })} className="w-full accent-[var(--primary)]" />
          <div className="flex justify-between fs-text text-muted-foreground"><span>Compact</span><span>Comfortable</span></div>
        </div>
      </div>
    </section>
  );
}
