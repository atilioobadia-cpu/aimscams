import { cache } from "react";
import { cookies } from "next/headers";

import type { AuthUser } from "@/lib/auth-types";

const SERVER_API_BASE = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000"
).replace(/\/$/, "");

export const getServerAuthUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const cookie = cookieStore.toString();
  if (!cookie) return null;

  try {
    const response = await fetch(`${SERVER_API_BASE}/auth/me`, {
      headers: { accept: "application/json", cookie },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { user?: AuthUser };
    return payload.user ?? null;
  } catch {
    return null;
  }
});
