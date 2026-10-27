import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "User details · AIMSCAMS",
};

/**
 * Legacy create/edit URL. The form is a modal on the users list now, so the old
 * address keeps working by redirecting into it.
 */
export default async function SettingsAdministratorAddPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const id = typeof params.id === "string" ? params.id : undefined;
  redirect(id ? `/settings-administrator?modal=edit&id=${id}` : "/settings-administrator?modal=create");
}
