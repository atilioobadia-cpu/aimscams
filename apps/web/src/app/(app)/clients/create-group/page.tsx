"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { createClient } from "@/lib/settings";

function message(failure: unknown, fallback: string): string {
  if (failure instanceof ApiError) return failure.message;
  if (failure instanceof Error && failure.message) return failure.message;
  return fallback;
}

const STEPS = ["Membership details", "Group details", "Meeting schedule"];

export default function CreateGroupPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [referenceNo, setReferenceNo] = useState("");
  const [groupName, setGroupName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [membershipPolicy, setMembershipPolicy] = useState("");
  const [joiningDate, setJoiningDate] = useState("");

  const [meetingDay, setMeetingDay] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingPlace, setMeetingPlace] = useState("");

  function next() {
    if (step === 1 && (!referenceNo.trim() || !groupName.trim())) {
      setError("Reference number and group name are required.");
      return;
    }
    setError(null);
    setStep((value) => Math.min(STEPS.length, value + 1));
  }

  function back() {
    setError(null);
    setStep((value) => Math.max(1, value - 1));
  }

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      await createClient({
        referenceNo: referenceNo.trim().toUpperCase(),
        fullName: groupName.trim(),
        clientType: "GROUP",
        branchId: branchId || null,
        profile: {
          membership: { branchId, membershipPolicy, joiningDate },
          group: { name: groupName.trim() },
          meeting: { day: meetingDay, time: meetingTime, place: meetingPlace },
        },
      });
      pushToast("Group created.");
      router.push("/clients");
      router.refresh();
    } catch (failure) {
      setError(message(failure, "Could not create this group."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/clients">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Clients
          </Link>
        </Button>
      </div>

      <PageHeader title="Add group" description="Three-step group registration." />

      <div className="rounded-[var(--card-radius)] border border-card-border bg-surface p-[var(--space-16)]">
        <p className="text-fs font-medium text-strong">
          Step {step} of {STEPS.length}: {STEPS[step - 1]}
        </p>
        <div className="mt-3 h-2 rounded-full bg-subtle">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${(step / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <form className="space-y-5 rounded-xl border border-card-border bg-surface p-5" onSubmit={(event) => { event.preventDefault(); if (step < STEPS.length) next(); else void submit(); }}>
        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-fs font-medium text-body" htmlFor="group-reference">
                Reference number
              </label>
              <Input id="group-reference" value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block text-fs font-medium text-body" htmlFor="group-name">
                Group name
              </label>
              <Input id="group-name" value={groupName} onChange={(event) => setGroupName(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block text-fs font-medium text-body" htmlFor="group-branch">
                Branch ID
              </label>
              <Input id="group-branch" value={branchId} onChange={(event) => setBranchId(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block text-fs font-medium text-body" htmlFor="group-policy">
                Membership policy
              </label>
              <Input id="group-policy" value={membershipPolicy} onChange={(event) => setMembershipPolicy(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block text-fs font-medium text-body" htmlFor="group-joining-date">
                Joining date
              </label>
              <Input id="group-joining-date" type="date" value={joiningDate} onChange={(event) => setJoiningDate(event.target.value)} className="h-[var(--control-height)]" />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-fs font-medium text-body" htmlFor="group-meeting-day">
                Meeting day
              </label>
              <Input id="group-meeting-day" value={meetingDay} onChange={(event) => setMeetingDay(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block text-fs font-medium text-body" htmlFor="group-meeting-time">
                Meeting time
              </label>
              <Input id="group-meeting-time" value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)} className="h-[var(--control-height)]" />
            </div>
            <div>
              <label className="mb-1 block text-fs font-medium text-body" htmlFor="group-meeting-place">
                Meeting place
              </label>
              <Input id="group-meeting-place" value={meetingPlace} onChange={(event) => setMeetingPlace(event.target.value)} className="h-[var(--control-height)]" />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <p className="text-fs text-muted-foreground">Review and submit the group.</p>
        ) : null}

        {error ? <p role="alert" className="text-fs text-accent-red">{error}</p> : null}

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={back} disabled={step === 1 || saving}>
            Back
          </Button>
          {step < STEPS.length ? (
            <Button type="button" onClick={next} className="h-[var(--control-height)] px-[var(--space-16)] text-fs font-semibold">
              Next
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" disabled={saving} aria-busy={saving} className="h-[var(--control-height)] px-[var(--space-16)] text-fs font-semibold">
              {saving ? "Saving..." : "Create group"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
