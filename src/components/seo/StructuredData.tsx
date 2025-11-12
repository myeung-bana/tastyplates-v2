"use client";

import { generateStructuredData } from "@/lib/seo";

interface StructuredDataProps {
  type?: "WebSite" | "Restaurant" | "Article" | "BreadcrumbList" | "Organization";
  data?: any;
}

/**
 * Component to inject JSON-LD structured data into the page
 * This helps search engines understand the content better
 */
export default function StructuredData({ type = "WebSite", data }: StructuredDataProps) {
  const structuredData = generateStructuredData({ type, ...data });

  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

