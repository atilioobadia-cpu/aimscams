"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, FormError, SuccessNote } from "@/components/accounting/states";
import { PolicySetupHeader } from "@/components/settings/policy-setup-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { createHoliday, listHolidays, type Holiday } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function HolidaysPage() {
  const { pushToast } = useToast();
  const [data, setData] = useState<Awaited<ReturnType<typeof listHolidays>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());

  const [workingDays, setWorkingDays] = useState<Record<string, boolean>>({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false,
    Sunday: false,
  });

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        if (firstLoad.current) setLoading(true);
        setError(null);

        void listHolidays()
          .then((next) => {
            if (cancelled) return;
            setData(next);
            setForbidden(false);
          })
          .catch((failure: unknown) => {
            if (cancelled) return;
            if (failure instanceof ApiError && failure.status === 403) {
              setForbidden(true);
              setData(null);
            } else {
              setError(message(failure, "Could not load holidays."));
            }
          })
          .finally(() => {
            if (cancelled) return;
            firstLoad.current = false;
            setLoading(false);
          });
      },
      firstLoad.current ? 0 : 250,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reloadKey]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaved(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveError("Name is required.");
      return;
    }
    if (!date) {
      setSaveError("Holiday date is required.");
      return;
    }

    setSaving(true);
    try {
      await createHoliday({ name: trimmedName, holidayDate: date });
      pushToast("Holiday created.");
      setSaved("Created.");
      setModalOpen(false);
      setName("");
      setDate("");
      setReloadKey((value) => value + 1);
    } catch (failure) {
      setSaveError(message(failure, "Could not create this holiday."));
    } finally {
      setSaving(false);
    }
  }

  const items = data?.items ?? [];
  const firstMonthDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const mondayOffset = (firstMonthDay.getDay() + 6) % 7;
  const calendarDays = Array.from({ length: 42 }, (_, index) => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - mondayOffset + 1));
  const calendarYears = Array.from({ length: 11 }, (_, index) => visibleMonth.getFullYear() - 5 + index);

  return (
    <div className="space-y-5">
      <PolicySetupHeader active="holidays" />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <h2 className="mb-3 flex items-center gap-2 fs-section-title font-semibold text-strong"><CalendarDays className="size-4 text-primary" aria-hidden="true" />Working Days</h2>
        <p className="mb-3 fs-text text-muted-foreground">Days the branch is open. Affects due-date calculation.</p>
        <div className="flex flex-wrap gap-4">
          {Object.keys(workingDays).map((day) => (
            <label key={day} className="flex items-center gap-2 fs-text text-body">
              <input
                type="checkbox"
                checked={workingDays[day]}
                onChange={(e) => setWorkingDays((prev) => ({ ...prev, [day]: e.target.checked }))}
                className="size-4 rounded border-input"
              />
              {day}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <Button type="button" variant="outline" onClick={() => pushToast("Working days policy arrives with the scheduling module.")}>
            Save working days
          </Button>
        </div>
      </section>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view holidays. Ask an administrator for Settings Policy : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-chrome px-4 py-3">
            {data?.canEdit ? <Button type="button" variant="outline" onClick={() => setModalOpen(true)} className="h-[38px] border-primary px-3 text-primary hover:bg-primary-tint hover:text-primary"><Plus className="size-4" aria-hidden="true" />Add Holiday</Button> : <span />}
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="holiday-month">Month</label>
              <select id="holiday-month" value={visibleMonth.getMonth()} onChange={(event) => setVisibleMonth((current) => new Date(current.getFullYear(), Number(event.target.value), 1))} className="h-[38px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text">
                {Array.from({ length: 12 }, (_, month) => <option key={month} value={month}>{new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(2026, month, 1))}</option>)}
              </select>
              <label className="sr-only" htmlFor="holiday-year">Year</label>
              <select id="holiday-year" value={visibleMonth.getFullYear()} onChange={(event) => setVisibleMonth((current) => new Date(Number(event.target.value), current.getMonth(), 1))} className="h-[38px] rounded-[var(--control-radius)] border border-input bg-background px-3 fs-text">
                {calendarYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft className="size-4" aria-hidden="true" /></Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight className="size-4" aria-hidden="true" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-l border-t border-card-border text-center fs-caption font-semibold text-label">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => <div key={day} className="border-b border-r border-card-border bg-subtle px-1 py-3">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 border-l border-card-border">
            {calendarDays.map((day) => {
              const dayHolidays = items.filter((item: Holiday) => item.holidayDate.slice(0, 10) === dateKey(day));
              const inMonth = day.getMonth() === visibleMonth.getMonth();
              return (
                <div key={dateKey(day)} className={`min-h-[92px] border-b border-r border-card-border p-2 ${inMonth ? "bg-card" : "bg-subtle/50"}`}>
                  <span className={`fs-caption ${inMonth ? "text-body" : "text-muted-foreground"}`}>{day.getDate()}</span>
                  <div className="mt-1 space-y-1">{dayHolidays.map((holiday) => <div key={holiday.id} title={holiday.name} className="truncate rounded bg-primary-tint px-1.5 py-1 fs-caption font-medium text-primary">{holiday.name}</div>)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Holiday" size="large">
        <form className="space-y-5" onSubmit={(event) => void save(event)}>
          <div className="grid gap-4 rounded-md border border-chrome bg-subtle p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="holiday-name">Name <span className="text-accent-red" aria-hidden="true">*</span></label>
              <Input id="holiday-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)] bg-background" />
            </div>
            <div>
              <label className="mb-1 block fs-text font-medium text-body" htmlFor="holiday-date">Date <span className="text-accent-red" aria-hidden="true">*</span></label>
              <Input id="holiday-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-[var(--control-height)] bg-background" />
            </div>
            <label className="flex items-center gap-2 pb-2 fs-text text-muted-foreground"><input type="checkbox" disabled className="size-4" />Recurring</label>
            <p className="md:col-span-3 fs-caption text-muted-foreground">Recurring holidays are not saved by the current holiday model.</p>
          </div>
          <Button type="button" variant="outline" disabled className="border-primary text-primary"><Plus className="size-4" aria-hidden="true" />Add Another Holiday</Button>
          <p className="fs-caption text-muted-foreground">The current create endpoint accepts one holiday at a time.</p>

          <FormError message={saveError} />
          <SuccessNote message={saved} />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
