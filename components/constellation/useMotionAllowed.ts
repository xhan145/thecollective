"use client";

// Both motion gates in one hook: the OS prefers-reduced-motion setting AND the
// in-app preference (html[data-motion="reduced"], set by CustomizationProvider).
// CSS animations are double-gated by selectors already; this hook is for the
// JS-driven pieces (framer transitions, SVG shimmer mount, draw-in).

import { useEffect, useState } from "react";

function readAllowed(): boolean {
  if (typeof window === "undefined") return true;
  const os = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const app = document.documentElement.getAttribute("data-motion") === "reduced";
  return !os && !app;
}

export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(true);
  useEffect(() => {
    setAllowed(readAllowed());
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onMq = () => setAllowed(readAllowed());
    mq?.addEventListener?.("change", onMq);
    const observer = new MutationObserver(onMq);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => {
      mq?.removeEventListener?.("change", onMq);
      observer.disconnect();
    };
  }, []);
  return allowed;
}

/** Pause ambient loops when the tab is hidden (spec: no offscreen burn). */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === "visible");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}
