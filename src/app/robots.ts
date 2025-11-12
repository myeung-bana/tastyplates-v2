import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

/**
 * Generate robots.txt for search engines
 * This helps control how search engines crawl your site
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/profile/",
          "/add-review/",
          "/edit-review/",
          "/onboarding/",
          "/onboarding2/",
          "/reset-password/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/profile/",
          "/add-review/",
          "/edit-review/",
          "/onboarding/",
          "/onboarding2/",
          "/reset-password/",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/profile/",
          "/add-review/",
          "/edit-review/",
          "/onboarding/",
          "/onboarding2/",
          "/reset-password/",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

