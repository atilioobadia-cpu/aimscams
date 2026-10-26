import type { Metadata } from "next";

import { UserForm } from "@/components/settings/user-form";

export const metadata: Metadata = {
  title: "User details · AIMSCAMS",
};

export default async function SettingsAdministratorAddPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  return <UserForm id={typeof params.id === "string" ? params.id : undefined} />;
}
