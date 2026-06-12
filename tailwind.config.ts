import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        signal: "#12F7D6",
        flow: "#B8FF4D",
        pulse: "#FF3D81",
        violet: "#7C5CFF",
        night: "#07080D",
        ink: "#F7F8FF",
        muted: "#A7ACB9",
        soft: "#151822",
        card: "#10131B",
        cardHi: "#181C27",
        line: "#282E3C",
        success: "#38E087",
        warning: "#F6C85F",
        danger: "#FF6B6B",
        cream: "#07080D",
        gold: "#12F7D6",
        goldBright: "#12F7D6",
        goldDeep: "#0FB9A7",
      },
      borderRadius: {
        card: "8px",
        sheet: "18px",
      },
      boxShadow: {
        warm: "0 18px 60px rgba(0, 0, 0, 0.28)",
        warmLg: "0 24px 90px rgba(18, 247, 214, 0.16)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
