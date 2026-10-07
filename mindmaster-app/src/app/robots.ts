import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.mindmasteracademy.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courses", "/course/", "/login", "/books"],
        disallow: ["/admin/", "/sub/", "/api/", "/checkout", "/watch/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
