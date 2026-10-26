import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.mindmasteracademy.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createAdminClient();
    const { data: courses } = await supabase
      .from("courses")
      .select("id, is_published");

    if (courses && courses.length > 0) {
      courseRoutes = courses
        .filter((c: any) => c.is_published !== false)
        .map((course: any) => ({
          url: `${baseUrl}/course/${course.id}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.85,
        }));
    }
  } catch (e) {
    // Graceful fallback if database connection is pending
  }

  return [...staticRoutes, ...courseRoutes];
}

