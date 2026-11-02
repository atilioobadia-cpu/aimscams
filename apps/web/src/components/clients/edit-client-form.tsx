"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ForbiddenPanel } from "@/components/accounting/states";
import { PageHeader } from "@/components/data/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api";
import { getClient, updateClient } from "@/lib/settings";

export function EditClientForm({ id }: { id: string }) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationalId, setNationalId] = useState("");

  useEffect(() => {
    let active = true;
    void getClient(id)
      .then(({ client, canEdit: allowed }) => {
        if (!active) return;
        setCanEdit(allowed);
        setFullName(client.fullName);
        setPhone(client.phone ?? "");
        setEmail(client.email ?? "");
        setNationalId(client.nationalId ?? "");
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Could not load client details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateClient(id, {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        nationalId: nationalId.trim() || null,
      });
      pushToast("Client updated.");
      router.push(`/clients/${encodeURIComponent(id)}`);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof ApiError || failure instanceof Error ? failure.message : "Could not update client.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 text-[13.44px] text-[#495057]">
      <PageHeader breadcrumb="Client" title="Update client" description="Update the client’s contact and identity details." />
      {error ? <p role="alert" className="rounded-[6.72px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">{error}</p> : null}
      {!loading && !canEdit ? (
        <ForbiddenPanel message="Your role cannot edit clients. Ask an administrator for Client : Edit." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-[8px] border border-[#dee2e6] bg-white p-[16px]">
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span>Full Name</span>
              <Input required maxLength={160} value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={loading || saving || !canEdit} />
            </label>
            <label className="space-y-1.5">
              <span>Phone Number</span>
              <Input type="tel" maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} disabled={loading || saving || !canEdit} />
            </label>
            <label className="space-y-1.5">
              <span>Email Address</span>
              <Input type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading || saving || !canEdit} />
            </label>
            <label className="space-y-1.5">
              <span>National ID Number</span>
              <Input maxLength={64} value={nationalId} onChange={(event) => setNationalId(event.target.value)} disabled={loading || saving || !canEdit} />
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#dee2e6] pt-4">
            <Button asChild type="button" variant="outline" disabled={saving}>
              <Link href={`/clients/${encodeURIComponent(id)}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading || saving || !canEdit}>{saving ? "Saving…" : "Save Changes"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
