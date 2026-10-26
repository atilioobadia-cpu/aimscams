import type { Metadata } from "next";

import { AppShell } from "@/components/shell/app-shell";
import { getServerAuthUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "AIMSCAMS",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerAuthUser();
  if (!user) redirect("/login");
  if (user.mfaEnrollmentRequired) redirect("/login/mfa/enroll");

  const branch = user.branch
    ? { ...user.branch, status: "Open" as const }
    : { code: "ALL", name: "All branches", status: "Open" as const };

  return (
    <AppShell
      institution={{
        name: user.organisation.name,
        code: user.organisation.code,
        dialect: user.organisation.dialect,
      }}
      branch={branch}
      user={{
        name: user.fullName,
        initials: initialsFor(user.fullName),
        role: user.roles.map((role) => role.name).join(", ") || "No role assigned",
      }}
    >
      {children}
    </AppShell>
  );
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
