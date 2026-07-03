// Tiny, dependency-free analytics wrapper. Fails silently when no provider is
// present (so it is safe to call from any client component). Routes to whatever
// is on `window` — PostHog or gtag — and logs in development for visibility.
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const w = window as unknown as {
    posthog?: { capture?: (n: string, p?: Record<string, unknown>) => void };
    gtag?: (kind: string, n: string, p?: Record<string, unknown>) => void;
  };

  try {
    if (w.posthog?.capture) {
      w.posthog.capture(name, properties);
      return;
    }
    if (w.gtag) {
      w.gtag("event", name, properties);
      return;
    }
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.info("[analytics]", name, properties ?? {});
    }
  } catch {
    /* never let analytics break the UI */
  }
}
