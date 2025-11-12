import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

/**
 * Generate sitemap for search engines
 * This helps Bing and other search engines discover all pages
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  // Static routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/restaurants`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/following`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/content-guidelines`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  // Note: For dynamic restaurant pages, you would fetch them from your API
  // and add them here. Example:
  // const restaurants = await fetchRestaurants();
  // restaurants.forEach(restaurant => {
  //   routes.push({
  //     url: `${baseUrl}/restaurants/${restaurant.slug}`,
  //     lastModified: restaurant.updatedAt,
  //     changeFrequency: "weekly",
  //     priority: 0.7,
  //   });
  // });

  return routes;
}

