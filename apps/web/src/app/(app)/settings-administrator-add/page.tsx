import type { Metadata } from "next";

import { UserForm } from "@/components/settings/user-form";

export const metadata: Metadata = {
  title: "New User · AIMSCAMS",
};

export default async function SettingsAdministratorAddPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const id = typeof params.id === "string" ? params.id : undefined;
  return <UserForm id={id} layout="page" />;
}
