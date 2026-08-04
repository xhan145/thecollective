import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { BetaAppProvider } from "@/components/beta/AppStateProvider";
import { ThemeProvider } from "@/components/beta/ThemeProvider";
import { CustomizationProvider } from "@/components/beta/CustomizationProvider";
import { ServiceWorkerRegister } from "@/components/beta/ServiceWorkerRegister";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Fraunces is the display face — loaded as a VARIABLE font (no explicit weight
// array; next/font rejects `axes` alongside one) so its optical-size axis works
// with `font-optical-sizing: auto`. Latin-only subset keeps the payload in check.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  // Without requesting opsz, next/font ships a wght-only instance and the
  // `font-optical-sizing: auto` in globals.css is inert.
  axes: ["opsz"],
});

// Set the theme class before first paint to avoid a flash.
const themeInitScript = `(function(){try{var p=localStorage.getItem('collective.theme')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Collective | Practice confidence in real life",
  description:
    "Build confidence and communication through small real-world practices, proof, useful feedback, and earned trust. No likes, followers, or fake status.",
  openGraph: {
    title: "Collective | Practice confidence in real life",
    description:
      "Small real-world practices, proof, useful feedback, and earned trust. No likes, followers, or fake status.",
    siteName: "Collective",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Collective — practice confidence in real life" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Collective | Practice confidence in real life",
    description: "Small steps. Real progress. No likes, followers, or fake status.",
    images: ["/og.png"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Collective",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
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
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Collective" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <CustomizationProvider>
            <QueryProvider>
              <BetaAppProvider>
                <ServiceWorkerRegister />
                {children}
              </BetaAppProvider>
            </QueryProvider>
          </CustomizationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
