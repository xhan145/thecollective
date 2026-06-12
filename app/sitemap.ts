import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://collective.example";
  const routes = [
    "",
    "/auth",
    "/home",
    "/directions",
    "/practice",
    "/feed",
    "/profile",
    "/app-feedback",
    "/install"
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date("2026-06-09T00:00:00.000Z"),
    changeFrequency: route === "" ? "weekly" : "daily",
    priority: route === "" ? 1 : 0.7
  }));
}
