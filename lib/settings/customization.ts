// Appearance/customization settings — the first slice of the eventual
// user_settings architecture. localStorage now; Supabase sync is a later
// sub-project (see TODO at bottom). Pure helpers are unit-tested.

export type PixelStyle = "off" | "soft" | "medium";
export type Density = "comfortable" | "compact";
export type CardRoundness = "soft" | "rounded" | "extra";
export type MotionPref = "full" | "reduced";
export type IconStyle = "soft" | "pixelSoft";
export type FontMode = "system" | "friendly" | "retroLabels";
export type AccentStrength = "calm" | "bright";
export type AvatarTreatment = "normal" | "softFrame";

export type Customization = {
  pixelStyle: PixelStyle;
  pixelGrid: boolean;
  density: Density;
  cardRoundness: CardRoundness;
  motion: MotionPref;
  iconStyle: IconStyle;
  fontMode: FontMode;
  accentStrength: AccentStrength;
  avatarTreatment: AvatarTreatment;
  beginnerSafeLanguage: boolean;
  hideAdvancedPractices: boolean;
};

export const DEFAULT_CUSTOMIZATION: Customization = {
  pixelStyle: "soft",
  pixelGrid: true,
  density: "comfortable",
  cardRoundness: "rounded",
  motion: "full",
  iconStyle: "pixelSoft",
  fontMode: "system",
  accentStrength: "calm",
  avatarTreatment: "softFrame",
  beginnerSafeLanguage: true,
  hideAdvancedPractices: false,
};

export const CUSTOMIZATION_STORAGE_KEY = "collective.customization.v1";

export function mergeCustomization(partial: Partial<Customization>, base: Customization = DEFAULT_CUSTOMIZATION): Customization {
  return { ...base, ...partial };
}

export function loadCustomization(): Customization {
  if (typeof window === "undefined") return DEFAULT_CUSTOMIZATION;
  try {
    const raw = window.localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMIZATION;
    return mergeCustomization(JSON.parse(raw) as Partial<Customization>);
  } catch {
    return DEFAULT_CUSTOMIZATION;
  }
}

export function saveCustomization(c: Customization): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* ignore quota/availability */
  }
}

/** Map customization → <html> data-attributes. Pure (returns the map) for testability. */
export function customizationDataAttributes(c: Customization, osReducedMotion = false): Record<string, string> {
  return {
    "data-pixel": c.pixelStyle,
    "data-pixel-grid": c.pixelGrid && c.pixelStyle !== "off" ? "on" : "off",
    "data-density": c.density,
    "data-roundness": c.cardRoundness,
    "data-motion": c.motion === "reduced" || osReducedMotion ? "reduced" : "full",
    "data-accent": c.accentStrength,
    "data-icons": c.iconStyle,
    "data-fontmode": c.fontMode,
  };
}

export function applyCustomizationToDom(c: Customization, osReducedMotion = false): void {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  for (const [k, v] of Object.entries(customizationDataAttributes(c, osReducedMotion))) el.setAttribute(k, v);
}

// TODO(settings-arch): when the full user_settings table lands, sync `customization`
// to/from Supabase user_settings.customization (jsonb) and reconcile localStorage as fallback.
