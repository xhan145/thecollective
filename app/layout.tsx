import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGNAL//FLOW",
  description:
    "AI-powered underground music discovery. Find them before they break.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SIGNAL//FLOW",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/brand/signal_flow_icon_dark_bg.png",
    apple: "/brand/signal_flow_social_avatar.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#07080D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
