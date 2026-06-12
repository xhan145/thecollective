import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://collective.example";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/beta-feedback-review"]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
