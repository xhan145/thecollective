import type { Config } from "tailwindcss";

/**
 * Design foundation.
 *
 * Colour: every value below is a CSS custom property defined once per theme in
 * app/globals.css. Components use semantic utilities (bg-surface, text-muted,
 * border-line) and NEVER a hardcoded hex — `npm run check:design` enforces it.
 * Because the utilities resolve to variables, switching .dark flips the whole UI
 * at once; no surface can be "missed" the way it was under the old per-hex remap.
 *
 * Type: the 8-step scale carries size + line-height + letter-spacing together,
 * so one class is always internally consistent. Weights are restricted to
 * 400/500/600 by convention (check:design fails on font-black/font-extrabold).
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "Cambria", "serif"],
      },
      fontSize: {
        display: ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "600" }],
        title: ["1.75rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "600" }],
        heading: ["1.25rem", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.6", letterSpacing: "0" }],
        body: ["0.9375rem", { lineHeight: "1.6", letterSpacing: "0" }],
        label: ["0.8125rem", { lineHeight: "1.45", letterSpacing: "0", fontWeight: "500" }],
        caption: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        overline: ["0.6875rem", { lineHeight: "1.3", letterSpacing: "0.07em", fontWeight: "500" }],
      },
      colors: {
        // ---- semantic tokens (theme-aware) ----
        bg: "var(--c-bg)",
        surface: {
          DEFAULT: "var(--c-surface)",
          soft: "var(--c-surface-soft)",
          input: "var(--c-surface-input)",
        },
        // Text colours are flat so call sites read naturally: text-content,
        // text-secondary, text-muted, text-subtle. (Primary is "content" rather
        // than "ink" because the legacy palette below already owns `ink`.)
        content: "var(--c-text)",
        secondary: "var(--c-text-secondary)",
        muted: "var(--c-text-muted)",
        subtle: "var(--c-text-subtle)",
        accent: {
          DEFAULT: "var(--c-accent)",
          text: "var(--c-accent-text)",
          soft: "var(--c-accent-soft)",
        },
        line: "var(--c-line)",
        success: {
          DEFAULT: "var(--c-success)",
          text: "var(--c-success-text)",
          soft: "var(--c-success-soft)",
        },
        danger: {
          DEFAULT: "var(--c-danger)",
          text: "var(--c-danger-text)",
          soft: "var(--c-danger-soft)",
        },
        info: { soft: "var(--c-info-soft)" },

        // ---- LEGACY palette (pre-beta dark design) ----
        // Used only by legacy routes/components (/dashboard, /setup, /feed-system,
        // /paths and the orphaned root components/*) that are slated for removal
        // under the R8 legacy-route cleanup. Kept so those pages don't break; NOT
        // part of the semantic system and excluded from the design guard.
        ink: "#0E1117",
        panel: "#171B24",
        panel2: "#202632",
        paper: "#F6F3EC",
        purple: "#8D8AFB",
        purple2: "#B8B5FF",
        teal: "#76C7C0",
        green: "#75D1A3",
        orange: "#E9B66B",
        red: "#F07B7B",
      },
      boxShadow: {
        glow: "0 24px 80px rgba(141, 138, 251, .18)",
        soft: "0 18px 50px rgba(0, 0, 0, .22)",
        float: "0 24px 80px rgba(0, 0, 0, .34)",
      },
    },
  },
  plugins: [],
};

export default config;
