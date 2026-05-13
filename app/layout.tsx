import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Collective", description: "Practice, proof, feedback, trust, and contribution.", manifest: "/manifest.json" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, themeColor: "#070A12" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
