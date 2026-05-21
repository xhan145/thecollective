import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1117",
        panel: "#171B24",
        panel2: "#202632",
        paper: "#F6F3EC",
        muted: "#8F887E",
        purple: "#8D8AFB",
        purple2: "#B8B5FF",
        teal: "#76C7C0",
        green: "#75D1A3",
        orange: "#E9B66B",
        red: "#F07B7B"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(141, 138, 251, .18)",
        soft: "0 18px 50px rgba(0, 0, 0, .22)",
        float: "0 24px 80px rgba(0, 0, 0, .34)"
      }
    }
  },
  plugins: []
};

export default config;
