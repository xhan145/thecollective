import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { BetaAppProvider } from "@/components/beta/AppStateProvider";
import { ThemeProvider } from "@/components/beta/ThemeProvider";
import { CustomizationProvider } from "@/components/beta/CustomizationProvider";
import { ServiceWorkerRegister } from "@/components/beta/ServiceWorkerRegister";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-lora", display: "swap" });

// Set the theme class before first paint to avoid a flash.
const themeInitScript = `(function(){try{var p=localStorage.getItem('collective.theme')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Collective | Practice confidence in real life",
  description:
    "Build confidence and communication through small real-world practices, proof, useful feedback, and earned trust. No likes, followers, or fake status.",
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
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
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
