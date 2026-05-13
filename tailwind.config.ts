import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#070A12", panel: "#10151F", panel2: "#171D29", purple: "#8B5CF6", purple2: "#A855F7", green: "#22C55E", orange: "#FB923C" }, boxShadow: { glow: "0 0 40px rgba(139,92,246,.28)" } } },
  plugins: []
};
export default config;
