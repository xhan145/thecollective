export const designTokens = {
  colors: {
    background: "#0E1117",
    elevatedSurface: "#171B24",
    softSurface: "#202632",
    cardSurface: "rgba(255, 255, 255, 0.07)",
    mutedSurface: "rgba(255, 255, 255, 0.045)",
    textPrimary: "#F6F3EC",
    textSecondary: "#C8C2B8",
    textTertiary: "#8F887E",
    primaryAccent: "#8D8AFB",
    softAccent: "#D8D4FF",
    success: "#75D1A3",
    warning: "#E9B66B",
    error: "#F07B7B",
    border: "rgba(246, 243, 236, 0.10)",
    overlay: "rgba(9, 11, 15, 0.72)"
  },
  typography: {
    display: "text-[34px] leading-[1.02] font-black tracking-tight",
    title: "text-2xl leading-tight font-black tracking-tight",
    sectionTitle: "text-lg leading-6 font-black",
    body: "text-sm leading-6",
    bodySmall: "text-xs leading-5",
    caption: "text-[11px] leading-4",
    label: "text-xs font-black uppercase tracking-[0.12em]",
    button: "text-sm font-black"
  },
  spacing: {
    4: "4px",
    8: "8px",
    12: "12px",
    16: "16px",
    20: "20px",
    24: "24px",
    32: "32px",
    40: "40px"
  },
  radius: {
    xs: "10px",
    sm: "14px",
    md: "18px",
    lg: "24px",
    xl: "30px",
    pill: "999px"
  },
  elevation: {
    minimal: "0 1px 1px rgba(0, 0, 0, 0.18)",
    soft: "0 18px 50px rgba(0, 0, 0, 0.22)",
    floating: "0 24px 80px rgba(0, 0, 0, 0.34)"
  }
} as const;
