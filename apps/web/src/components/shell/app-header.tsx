"use client";

import {
  Building2,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  LogOut,
  Mail,
  Phone,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { InstitutionLogo } from "@/components/brand/institution-logo";
import { TanzaniaFlag } from "@/components/brand/tanzania-flag";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiAssetUrl, apiRequest } from "@/lib/api";
import { listBranches } from "@/lib/users";

import type { DashboardFixture } from "@/lib/fixtures/dashboard";

type AppHeaderProps = {
  institution: DashboardFixture["institution"];
  branch: DashboardFixture["branch"];
  user: DashboardFixture["user"];
};

type BranchOption = { id: string; name: string };

const LANGUAGE_LABEL: Record<string, string> = {
  English: "English",
  Kiswahili: "Kiswahili",
};

export function AppHeader({ institution, branch, user }: AppHeaderProps) {
  const router = useRouter();
  const [language, setLanguage] = useState("English");
  const [branchOpen, setBranchOpen] = useState(() => {
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Dar_es_Salaam", hour: "2-digit", hour12: false }).format(new Date()));
    return hour >= 8 && hour < 17;
  });
  const [branchOptions, setBranchOptions] = useState<BranchOption[] | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  useEffect(() => {
    const syncBranchStatus = () => {
      const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Dar_es_Salaam", hour: "2-digit", hour12: false }).format(new Date()));
      setBranchOpen(hour >= 8 && hour < 17);
    };
    syncBranchStatus();
    const timer = window.setInterval(syncBranchStatus, 60000);
    return () => window.clearInterval(timer);
  }, []);
  const logoUrl = apiAssetUrl(institution.logoUrl);

  async function loadBranches(open: boolean) {
    if (!open || branchOptions !== null) return;
    try {
      const rows = await listBranches();
      setBranchOptions(rows.map((row) => ({ id: row.id, name: row.name })));
    } catch {
      setBranchOptions([]);
    }
  }

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

  const options: BranchOption[] =
    branchOptions && branchOptions.length
      ? branchOptions
      : [{ id: "current", name: branch.name }];
  const branchName = selectedBranch ?? branch.name;

  return (
    <header
      data-testid="app-header"
      data-parity="header"
      className="app-header fixed inset-x-0 top-0 z-50 block h-[var(--header-height)] border-b-[0.666667px] border-[#dee2e6] bg-surface pt-[8.15px]"
    >
      <div
        data-parity="header-toolbar"
        className="flex h-[47.03px] w-full items-center justify-between gap-[13.44px] px-[13.44px]"
      >
        <div
          data-parity="header-start"
          className="flex min-w-0 flex-1 items-center justify-start gap-[13.44px] overflow-hidden"
        >
          <div
            data-parity="header-tenant-block"
            className="flex min-w-0 flex-1 items-center gap-[6.72px] max-w-[376.31px]"
          >
            <InstitutionLogo
              src={logoUrl}
              alt={institution.name}
              monogram={initialsFor(institution.name)}
              size={40.31}
              dataParity="header-tenant"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-[3.36px]">
              <p
                data-parity="header-tenant-name"
                className="truncate text-[13.44px] font-medium leading-[16.8px] text-[#495057]"
                title={institution.name}
              >
                {institution.name}
              </p>
              <p
                data-parity="header-tenant-id"
                className="truncate text-[11.76px] leading-[normal] text-[#6c757d]"
                title={`${institution.dialect} SACCOS`}
              >
                {institution.registrationNo ?? `${institution.dialect} SACCOS`}
              </p>
            </div>
          </div>
        </div>

        <div data-parity="header-end" className="flex shrink-0 items-center gap-[13.44px]">
          <div data-parity="header-user-menu" className="flex items-center">
          <span
            data-parity="header-flag"
            className="box-border flex shrink-0 items-center justify-center"
            style={{ width: "33.4px", height: "22.71px" }}
          >
            <TanzaniaFlag />
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-testid="language-trigger"
                data-parity="header-language"
                aria-label={`Language: ${language}`}
                className="flex shrink-0 items-center rounded-[6px] bg-white p-0 text-left text-[13.44px] text-[#495057] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                style={{ width: "94.07px", height: "30.79px" }}
              >
                <span
                  data-parity="header-language-label"
                  className="block flex-1 truncate text-[11.76px] leading-[normal]"
                  style={{ padding: "8.4px 10.08px" }}
                >
                  {LANGUAGE_LABEL[language] ?? language}
                </span>
                <span
                  data-parity="header-language-chevron-cell"
                  className="flex items-center justify-center"
                  style={{ width: "33.59px", height: "30.79px", color: "rgb(100,116,139)", fontSize: "13.44px" }}
                >
                  <ChevronDown data-parity="header-language-chevron" className="size-[13.44px]" aria-hidden="true" />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={2.21}
              className="w-[94.07px] min-w-0 rounded-[6px] border-[0.666667px] border-[#e2e8f0] bg-white p-0 shadow-[0_2px_12px_rgba(0,0,0,0.1)] ring-0"
            >
              <div className="py-[6.72px]">
                {Object.keys(LANGUAGE_LABEL).map((key) => (
                  <DropdownMenuItem
                    key={key}
                    onSelect={() => setLanguage(key)}
                    aria-checked={language === key}
                    data-checked={language === key}
                    className="h-[32.79px] rounded-none py-0 pl-[13.44px] pr-[13.44px] text-[13.44px] leading-[normal] text-[#495057] focus:bg-[#057573] focus:text-white data-[checked=true]:bg-[#057573] data-[checked=true]:text-white"
                  >
                    {LANGUAGE_LABEL[key]}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu onOpenChange={(open) => void loadBranches(open)}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-testid="branch-context"
                data-parity="header-branch"
                aria-label={`Branch: ${branchName}, ${branchOpen ? "Open" : "Closed"}`}
                className="flex shrink-0 items-center justify-center rounded-[8px] border-[0.666667px] border-transparent bg-transparent text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                style={{ height: "41.78px", padding: "6.72px 10.08px", gap: "6.72px", fontWeight: 500 }}
              >
                <Building2
                  data-parity="header-branch-icon"
                  className="size-[15.13px] shrink-0 text-primary"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span
                  data-parity="header-branch-info"
                  className="flex flex-col items-start gap-[1.68px]"
                >
                  <span
                    data-parity="header-branch-name"
                    className="whitespace-nowrap text-[11.76px] font-medium leading-[normal] text-primary"
                  >
                    {branchName}
                  </span>
                  <span
                    data-parity="header-branch-status"
                    className={`flex items-center gap-[5.04px] font-normal text-[9.408px] leading-[normal] ${branchOpen ? "text-primary" : "text-accent-red"}`}
                  >
                    {branchOpen ? (
                      <CheckCircle2 data-parity="header-branch-status-icon" className="size-[9.42px]" strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <X data-parity="header-branch-status-icon" className="size-[9.42px]" strokeWidth={2} aria-hidden="true" />
                    )}
                    {branchOpen ? "Open" : "Closed"}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={10.22}
              alignOffset={-15.33}
              className="w-[200px] min-w-0 rounded-[6px] border-[0.666667px] border-[#e2e8f0] bg-white p-[4.704px_0] shadow-[0_1px_3px_rgba(0,0,0,0.1)] ring-0"
            >
              <div className="p-[13.44px]">
                <div className="flex flex-col">
                  {options.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onSelect={() => setSelectedBranch(option.name)}
                      aria-checked={branchName === option.name}
                      className="flex h-[34.15px] items-center rounded-none px-[13.44px] py-[10.08px] text-[11.76px] font-semibold leading-[normal] text-primary focus:bg-[#e6f1f1] focus:text-primary"
                    >
                      {option.name}
                    </DropdownMenuItem>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-testid="user-menu-trigger"
                data-parity="header-user"
                aria-label={`Account menu for ${user.name}`}
                className="flex shrink-0 items-center rounded-[8px] bg-transparent text-start outline-none transition-colors hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ring/50"
                style={{ height: "47.03px", padding: "6.72px", gap: "6.72px" }}
              >
                <span
                  data-testid="header-avatar"
                  data-parity="header-user-avatar"
                  className="flex shrink-0 items-center justify-center rounded-full text-start font-semibold text-on-primary"
                  style={{
                    width: "33.59px",
                    height: "33.59px",
                    background: "linear-gradient(180deg, #2d78b8 0%, #1c4f93 100%)",
                    boxShadow: "rgba(0,0,0,0.15) 0px 2px 8px 0px",
                    fontSize: "13.44px",
                  }}
                >
                  {user.initials}
                </span>
                <span
                  data-testid="header-user-name"
                  data-parity="header-user-name"
                  className="max-w-[112px] truncate text-start text-[11.76px] font-semibold leading-[14.112px] text-[#495057] lg:max-w-none"
                >
                  {user.name}
                </span>
                <ChevronDown
                  data-parity="header-user-chevron"
                  className="size-[10.08px] shrink-0"
                  style={{ color: "rgb(108,117,125)" }}
                  aria-hidden="true"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-[280px] rounded-[6px] shadow-[0_2px_12px_rgba(0,0,0,0.1)] ring-0">
              {user.email ? (
                <DropdownMenuItem asChild>
                  <a href={"mailto:" + user.email} aria-label={"Email " + user.email}>
                    <Mail aria-hidden="true" />
                    <span className="min-w-0 truncate">{user.email}</span>
                  </a>
                </DropdownMenuItem>
              ) : null}
              {user.phone ? (
                <DropdownMenuItem asChild>
                  <a href={"tel:" + user.phone} aria-label={"Call " + user.phone}>
                    <Phone aria-hidden="true" />
                    <span>{user.phone}</span>
                  </a>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/clients?type=GROUP">
                  <UsersRound aria-hidden="true" />
                  My groups
                </Link>
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
                {signingOut ? "Logging out" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
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
