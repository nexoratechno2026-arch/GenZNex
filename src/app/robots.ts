import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://genznex.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courses", "/courses/*", "/programs", "/jobs", "/verify/*", "/privacy", "/terms", "/refunds", "/contact"],
        disallow: [
          "/admin",
          "/admin/*",
          "/student",
          "/student/*",
          "/trainer",
          "/trainer/*",
          "/checkout/*",
          "/learn/*",
          "/settings/*",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
