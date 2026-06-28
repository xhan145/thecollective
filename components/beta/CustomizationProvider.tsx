"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type Customization,
  DEFAULT_CUSTOMIZATION,
  applyCustomizationToDom,
  loadCustomization,
  mergeCustomization,
  saveCustomization,
} from "@/lib/settings/customization";

type CustomizationContextValue = {
  customization: Customization;
  setCustomization: (partial: Partial<Customization>) => void;
};

const CustomizationContext = createContext<CustomizationContextValue | undefined>(undefined);

function osReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [customization, setState] = useState<Customization>(DEFAULT_CUSTOMIZATION);

  // Load persisted prefs + apply to <html> after mount (SSR-safe).
  useEffect(() => {
    const loaded = loadCustomization();
    setState(loaded);
    applyCustomizationToDom(loaded, osReducedMotion());
  }, []);

  // Re-apply if the OS reduced-motion preference changes.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => applyCustomizationToDom(loadCustomization(), mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  function setCustomization(partial: Partial<Customization>) {
    setState((prev) => {
      const next = mergeCustomization(partial, prev);
      saveCustomization(next);
      applyCustomizationToDom(next, osReducedMotion());
      return next;
    });
  }

  return (
    <CustomizationContext.Provider value={{ customization, setCustomization }}>{children}</CustomizationContext.Provider>
  );
}

export function useCustomization(): CustomizationContextValue {
  const ctx = useContext(CustomizationContext);
  // Safe fallback so components never crash if rendered outside the provider.
  if (!ctx) return { customization: DEFAULT_CUSTOMIZATION, setCustomization: () => {} };
  return ctx;
}
