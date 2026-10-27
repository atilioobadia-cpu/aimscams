"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, Building2 } from "lucide-react";

import { ErrorPanel, ForbiddenPanel, PanelSkeleton, FormError, SuccessNote } from "@/components/accounting/states";
import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/data/page-header";
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Holiday calendar" description="Public holidays that affect due-date calculation." />
        {data?.canEdit ? (
          <Button onClick={() => setModalOpen(true)} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
            <Plus className="size-4" aria-hidden="true" />
            Create holiday
          </Button>
        ) : null}
      </div>

      {forbidden ? (
        <ForbiddenPanel message="Your role cannot view holidays. Ask an administrator for Settings Policy : View." />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : loading ? (
        <section className="rounded-[var(--card-radius)] border border-card-border bg-surface">
          <PanelSkeleton rows={8} />
        </section>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No holidays yet"
          description="Create a holiday."
        />
      ) : (
        <section className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left fs-text">
              <thead className="border-b border-card-border bg-subtle fs-text font-semibold tracking-wide text-label">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: Holiday) => (
                  <tr key={item.id} className="border-b border-card-border last:border-0">
                    <td className="px-4 py-3 font-medium text-strong">{item.name}</td>
                    <td className="px-4 py-3 text-body">{item.holidayDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create holiday">
        <form className="space-y-5" onSubmit={(event) => void save(event)}>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="holiday-name">
              Name
            </label>
            <Input id="holiday-name" value={name} onChange={(event) => setName(event.target.value)} className="h-[var(--control-height)]" />
          </div>
          <div>
            <label className="mb-1 block fs-text font-medium text-body" htmlFor="holiday-date">
              Date
            </label>
            <Input id="holiday-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-[var(--control-height)]" />
          </div>

          <FormError message={saveError} />
          <SuccessNote message={saved} />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] fs-text font-semibold">
              {saving ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
