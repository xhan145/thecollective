import type { Metadata, Viewport } from "next";
import { BetaAppProvider } from "@/components/beta/AppStateProvider";
import { ServiceWorkerRegister } from "@/components/beta/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Collective",
  description: "Practice, proof, feedback, trust, and contribution.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Collective",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/icons/collective-icon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icons/apple-touch-icon.svg", type: "image/svg+xml" }
    ]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FFF8EE"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Collective" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <BetaAppProvider>
          <ServiceWorkerRegister />
          {children}
        </BetaAppProvider>
      </body>
    </html>
  );
}
