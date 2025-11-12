import { Metadata } from "next";

// Site configuration
export const siteConfig = {
  name: "TastyPlates",
  description: "Discover the meal that fits your taste. Dine like a Brazilian in Tokyo - or Korean in New York? Find and share amazing food experiences with TastyPlates.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.tastyplates.co",
  ogImage: "/images/tastyplates_og_image.png", // You'll need to add this image
  twitterHandle: "@tastyplates", // Update with your actual Twitter handle
  locale: "en_US",
  type: "website",
};

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  image?: string;
  type?: "website" | "article" | "profile" | "restaurant";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  restaurantData?: {
    name: string;
    address?: string;
    rating?: number;
    priceRange?: string;
    cuisine?: string[];
    image?: string;
  };
}

/**
 * Generate comprehensive metadata for SEO
 * Optimized for Bing and other search engines
 */
export function generateMetadata({
  title,
  description,
  canonical,
  noindex = false,
  nofollow = false,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  tags,
  restaurantData,
}: SEOProps): Metadata {
  const fullTitle = title
    ? `${title} | ${siteConfig.name}`
    : `${siteConfig.name} - Discover Amazing Food Experiences`;
  
  const metaDescription = description || siteConfig.description;
  const canonicalUrl = canonical || siteConfig.url;
  const ogImage = image || restaurantData?.image || `${siteConfig.url}${siteConfig.ogImage}`;
  
  const metadata: Metadata = {
    title: fullTitle,
    description: metaDescription,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: type === "restaurant" ? "restaurant" : type,
      locale: siteConfig.locale,
      url: canonicalUrl,
      title: fullTitle,
      description: metaDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title || siteConfig.name,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(tags && tags.length > 0 && { tags }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: metaDescription,
      images: [ogImage],
      creator: siteConfig.twitterHandle,
      site: siteConfig.twitterHandle,
    },
    // Bing-specific meta tags
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION_CODE || "",
    },
    // Additional SEO meta tags
    keywords: tags?.join(", ") || "food reviews, restaurant reviews, food discovery, dining, cuisine, food experiences",
    authors: author ? [{ name: author }] : undefined,
    category: type === "restaurant" ? "Restaurant" : "Food & Dining",
  };

  // Add restaurant-specific Open Graph data
  if (restaurantData && type === "restaurant") {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: "restaurant",
      ...(restaurantData.address && {
        "restaurant:contact_info:street_address": restaurantData.address,
      }),
      ...(restaurantData.priceRange && {
        "restaurant:price_range": restaurantData.priceRange,
      }),
    };
  }

  return metadata;
}

/**
 * Generate JSON-LD structured data for Schema.org
 */
export function generateStructuredData({
  type = "WebSite",
  title,
  description,
  url,
  image,
  restaurantData,
  author,
  publishedTime,
  modifiedTime,
}: {
  type?: "WebSite" | "Restaurant" | "Article" | "BreadcrumbList" | "Organization";
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  restaurantData?: {
    name: string;
    address?: {
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };
    telephone?: string;
    priceRange?: string;
    servesCuisine?: string[];
    rating?: {
      ratingValue: number;
      reviewCount: number;
    };
    image?: string;
  };
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}) {
  const baseUrl = url || siteConfig.url;

  switch (type) {
    case "WebSite":
      return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.url}/restaurants?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      };

    case "Restaurant":
      if (!restaurantData) return null;
      
      const restaurantSchema: any = {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: restaurantData.name,
        description: description || `Discover ${restaurantData.name} on TastyPlates`,
        url: url || baseUrl,
        ...(restaurantData.image && {
          image: restaurantData.image,
        }),
        ...(restaurantData.address && {
          address: {
            "@type": "PostalAddress",
            ...(restaurantData.address.streetAddress && {
              streetAddress: restaurantData.address.streetAddress,
            }),
            ...(restaurantData.address.addressLocality && {
              addressLocality: restaurantData.address.addressLocality,
            }),
            ...(restaurantData.address.addressRegion && {
              addressRegion: restaurantData.address.addressRegion,
            }),
            ...(restaurantData.address.postalCode && {
              postalCode: restaurantData.address.postalCode,
            }),
            ...(restaurantData.address.addressCountry && {
              addressCountry: restaurantData.address.addressCountry,
            }),
          },
        }),
        ...(restaurantData.telephone && {
          telephone: restaurantData.telephone,
        }),
        ...(restaurantData.priceRange && {
          priceRange: restaurantData.priceRange,
        }),
        ...(restaurantData.servesCuisine && restaurantData.servesCuisine.length > 0 && {
          servesCuisine: restaurantData.servesCuisine,
        }),
        ...(restaurantData.rating && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: restaurantData.rating.ratingValue,
            reviewCount: restaurantData.rating.reviewCount,
            bestRating: "5",
            worstRating: "1",
          },
        }),
      };
      return restaurantSchema;

    case "Article":
      return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: description,
        image: image,
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        author: {
          "@type": "Person",
          name: author || siteConfig.name,
        },
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          logo: {
            "@type": "ImageObject",
            url: `${siteConfig.url}/icons/Favicon_Orange_Circle.png`,
          },
        },
      };

    case "Organization":
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        logo: `${siteConfig.url}/icons/Favicon_Orange_Circle.png`,
        sameAs: [
          // Add your social media profiles here
          // "https://twitter.com/tastyplates",
          // "https://facebook.com/tastyplates",
          // "https://instagram.com/tastyplates",
        ],
      };

    case "BreadcrumbList":
      // This would be generated dynamically based on the page
      return null;

    default:
      return null;
  }
}

