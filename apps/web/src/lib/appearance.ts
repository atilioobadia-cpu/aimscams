export type AppearancePreset = "mfsl" | "blue" | "classic";

export type AppearancePreferences = {
  preset: AppearancePreset;
  darkMode: boolean;
  primaryColor: string;
  scale: number;
};

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  preset: "mfsl",
  darkMode: false,
  primaryColor: "#057573",
  scale: 2,
};

export const APPEARANCE_COLORS = [
  "#057573",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#ec4899",
  "#6366f1",
  "#10b981",
] as const;

const STORAGE_KEY = "aimscams-appearance-v1";
const APPEARANCE_CHANGE_EVENT = "aimscams-appearance-change";
let cachedRaw: string | null | undefined;
let cachedPreferences = DEFAULT_APPEARANCE;
const PRESET_COLORS: Record<AppearancePreset, string> = {
  mfsl: "#057573",
  blue: "#2563eb",
  classic: "#92400e",
};

export function readAppearancePreferences(): AppearancePreferences {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === cachedRaw) return cachedPreferences;
    if (!saved) {
      cachedRaw = saved;
      cachedPreferences = DEFAULT_APPEARANCE;
      return cachedPreferences;
    }
    const value = JSON.parse(saved) as Partial<AppearancePreferences>;
    cachedRaw = saved;
    cachedPreferences = {
      preset: value.preset === "blue" || value.preset === "classic" ? value.preset : "mfsl",
      darkMode: value.darkMode === true,
      primaryColor: /^#[0-9a-f]{6}$/i.test(value.primaryColor ?? "")
        ? value.primaryColor!
        : DEFAULT_APPEARANCE.primaryColor,
      scale: Number.isInteger(value.scale) ? Math.max(2, Math.min(20, value.scale!)) : 2,
    };
    return cachedPreferences;
  } catch {
    cachedRaw = null;
    cachedPreferences = DEFAULT_APPEARANCE;
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearancePreferences(value: AppearancePreferences): void {
  const saved = JSON.stringify(value);
  window.localStorage.setItem(STORAGE_KEY, saved);
  cachedRaw = saved;
  cachedPreferences = value;
  applyAppearancePreferences(value);
  window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT));
}

export function subscribeAppearancePreferences(callback: () => void): () => void {
  window.addEventListener(APPEARANCE_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(APPEARANCE_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function applyAppearancePreferences(value: AppearancePreferences): void {
  const root = document.documentElement;
  const dark = value.darkMode;
  const scaleDelta = value.scale - DEFAULT_APPEARANCE.scale;
  root.style.colorScheme = dark ? "dark" : "light";
  root.style.setProperty("--primary", value.primaryColor);
  root.style.setProperty("--primary-fab", value.primaryColor);
  root.style.setProperty("--primary-tint", tint(value.primaryColor));
  root.style.setProperty("--page-bg", dark ? "#1f2937" : "#ebe9e9");
  root.style.setProperty("--surface", dark ? "#111827" : "#ffffff");
  root.style.setProperty("--text-heading", dark ? "#e5e7eb" : "#495057");
  root.style.setProperty("--text-strong", dark ? "#f9fafb" : "#111827");
  root.style.setProperty("--text-muted", dark ? "#9ca3af" : "#6c757d");
  root.style.setProperty("--border", dark ? "#374151" : "#dee2e6");
  root.style.setProperty("--border-header", dark ? "#4b5563" : "#c3c6ca");
  root.style.setProperty("--tab-inactive-bg", dark ? "#273449" : "#f8fafc");
  root.style.setProperty("--fs", `${12.8 + scaleDelta * 0.3}px`);
  root.style.setProperty("--fs-body", `${12.8 + scaleDelta * 0.3}px`);
  root.style.setProperty("--sidebar-label-size", `${13.34 + scaleDelta * 0.3}px`);
  root.style.setProperty("--fs-title", `${20 + scaleDelta * 0.5}px`);
}

export function presetColor(preset: AppearancePreset): string {
  return PRESET_COLORS[preset];
}

function tint(hex: string): string {
  const rgb = hex.slice(1).match(/.{2}/g)?.map((part) => parseInt(part, 16)) ?? [5, 117, 115];
  const mix = (channel: number) => Math.round(channel * 0.08 + 255 * 0.92);
  return `#${rgb.map((channel) => mix(channel).toString(16).padStart(2, "0")).join("")}`;
}
