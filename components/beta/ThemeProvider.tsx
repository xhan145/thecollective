"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";
const KEY = "collective.theme";

type ThemeContextValue = {
  pref: ThemePref;
  resolved: "light" | "dark";
  setTheme: (p: ThemePref) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function apply(pref: ThemePref) {
  if (typeof document === "undefined") return;
  const dark = pref === "dark" || (pref === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPref] = useState<ThemePref>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (window.localStorage.getItem(KEY) as ThemePref)) || "system";
    setPref(saved);
    apply(saved);
    setResolved(document.documentElement.classList.contains("dark") ? "dark" : "light");

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = (window.localStorage.getItem(KEY) as ThemePref) || "system";
      if (current === "system") {
        apply("system");
        setResolved(document.documentElement.classList.contains("dark") ? "dark" : "light");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((p: ThemePref) => {
    setPref(p);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, p);
    apply(p);
    setResolved(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  return <ThemeContext.Provider value={{ pref, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
