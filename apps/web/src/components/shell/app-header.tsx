"use client";

import { Building2, CheckCircle2, ChevronDown, LoaderCircle, LogOut, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AimscamsMark } from "@/components/brand/aimscams-mark";
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
import { apiRequest } from "@/lib/api";
import type { DashboardFixture } from "@/lib/fixtures/dashboard";

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
      className="app-header fixed inset-x-0 top-0 z-50 flex h-[var(--header-height)] items-center border-b border-chrome bg-surface px-[14px]"
    >
      <div className="flex min-w-0 items-center gap-2">
        <div
          data-testid="tenant-logo"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-tenant text-on-primary ring-2 ring-primary"
        >
          <AimscamsMark className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-fs font-semibold leading-tight text-body">
            {institution.name}
          </p>
          <p className="truncate text-fs leading-tight text-muted-foreground">
            {institution.dialect} SACCOS · {institution.code}
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-testid="language-trigger"
              aria-label={`Language: ${language}`}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-fs text-body outline-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring/50"
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
          aria-label={`Branch: ${branch.name}, ${branch.status}`}
        >
          <Building2 className="size-4 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <p className="text-fs font-semibold leading-tight text-brand">{branch.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-fs leading-none text-brand">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              {branch.status}
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
                className="grid size-[34px] shrink-0 place-items-center rounded-full text-fs font-bold text-on-primary" style={{background: 'linear-gradient(135deg, #1f7893 0%, #3279aa 50%, #537cd3 100%)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', outline: '2px solid #f7f7f7', outlineOffset: '-2px'}}
              >
                {user.initials}
              </span>
              <span
                data-testid="header-user-name"
                className="hidden text-fs font-semibold leading-none text-body xl:block"
              >
                {user.name}
              </span>
              <ChevronDown className="size-4 text-body" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={10} className="w-64">
            <DropdownMenuLabel>
              <span className="block text-fs font-semibold text-strong">{user.name}</span>
              <span className="mt-0.5 block text-fs font-normal text-muted-foreground">
                {user.role}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UserRound aria-hidden="true" />
              Profile
              <span className="ml-auto text-fs uppercase tracking-wide text-muted-foreground">
                Soon
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings aria-hidden="true" />
              Settings
              <span className="ml-auto text-fs uppercase tracking-wide text-muted-foreground">
                Phase 4
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {signOutError ? (
              <p className="px-1.5 py-1 text-fs leading-4 text-accent-red" role="alert">
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

