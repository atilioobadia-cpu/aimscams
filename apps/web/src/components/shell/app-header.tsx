"use client";

import {
  Building2,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { InstitutionLogo } from "@/components/brand/institution-logo";
import { TanzaniaFlag } from "@/components/brand/tanzania-flag";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiAssetUrl, apiRequest } from "@/lib/api";

import type { DashboardFixture } from "@/lib/fixtures/dashboard";
import { titleCase } from "@/lib/privacy";

type AppHeaderProps = {
  institution: DashboardFixture["institution"];
  branch: DashboardFixture["branch"];
  user: DashboardFixture["user"];
};

export function AppHeader({ institution, branch, user }: AppHeaderProps) {
  const router = useRouter();
  const [language, setLanguage] = useState("English");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const logoUrl = apiAssetUrl(institution.logoUrl);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setSignOutError("Could not sign out. Try again.");
      setSigningOut(false);
    }
  }

  return (
    <header
      data-testid="app-header"
      className="app-header fixed inset-x-0 top-0 z-50 flex h-[var(--header-height)] items-center border-b border-header bg-surface px-[14px]"
    >
      <div className="flex min-w-0 flex-[1_1_auto] items-center gap-3">
        <InstitutionLogo
          src={logoUrl}
          alt={institution.name}
          monogram={initialsFor(institution.name)}
        />
        <div className="min-w-0">
          <p
            className="truncate fs-text font-semibold leading-tight text-[#495057]"
            title={institution.name}
          >
            {institution.name}
          </p>
          <p
            className="truncate fs-text leading-tight text-[#6c757d]"
            title={`${institution.dialect} SACCOS`}
          >
            {institution.dialect} SACCOS
          </p>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="language-trigger"
              aria-label={`Language: ${language}`}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1.5 fs-text text-body outline-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <TanzaniaFlag className="h-4 w-6" />
              <span>{language}</span>
              <ChevronDown className="size-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={10} className="w-44">
            <DropdownMenuLabel>Language</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={language} onValueChange={setLanguage}>
              <DropdownMenuRadioItem value="English">English</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Kiswahili">Kiswahili</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div
          className="hidden items-center gap-3 lg:flex"
          data-testid="branch-context"
          aria-label={`Branch: ${branch.name}, ${titleCase(branch.status)}`}
        >
          <Building2 className="size-4 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <p className="fs-text font-semibold leading-tight text-brand">{branch.name}</p>
            <p className="mt-0.5 flex items-center gap-1 fs-text leading-none text-brand">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              {titleCase(branch.status)}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="user-menu-trigger"
              aria-label={`Account menu for ${user.name}`}
              className="flex items-center gap-3 rounded-md py-1.5 pl-2 pr-0 outline-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span
                data-testid="header-avatar"
                className="grid size-[34px] shrink-0 place-items-center rounded-full fs-text font-bold text-on-primary"
                style={{
                  background: "linear-gradient(135deg, #1f7893 0%, #3279aa 50%, #537cd3 100%)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  outline: "2px solid #f7f7f7",
                  outlineOffset: "-2px",
                }}
              >
                {user.initials}
              </span>
              <span
                data-testid="header-user-name"
                className="hidden fs-text font-semibold leading-none text-body xl:block"
              >
                {user.name}
              </span>
              <ChevronDown className="size-4 text-body" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={10} className="w-64">
            <DropdownMenuLabel>
              <span className="block fs-text font-semibold text-strong">{user.name}</span>
              <span className="mt-0.5 block fs-text font-normal text-muted-foreground">
                {user.role}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UserRound aria-hidden="true" />
              Profile
              <span className="ml-auto fs-text tracking-wide text-muted-foreground">
                Soon
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings aria-hidden="true" />
              Settings
              <span className="ml-auto fs-text tracking-wide text-muted-foreground">
                Phase 4
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {signOutError ? (
              <p className="px-1.5 py-1 fs-text leading-4 text-accent-red" role="alert">
                {signOutError}
              </p>
            ) : null}
            <DropdownMenuItem
              data-testid="sign-out"
              disabled={signingOut}
              onSelect={() => void signOut()}
            >
              {signingOut ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <LogOut aria-hidden="true" />
              )}
              {signingOut ? "Signing out" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
