"use client";

import { useEffect, useState } from "react";
import StructuredData from "@/components/seo/StructuredData";
import { Listing } from "@/interfaces/restaurant/restaurant";
import { calculateOverallRating } from "@/utils/reviewUtils";
import { GraphQLReview } from "@/types/graphql";

interface RestaurantStructuredDataProps {
  restaurant: Listing;
  reviews: GraphQLReview[];
}

/**
 * Client component to inject restaurant structured data
 * This helps search engines understand restaurant information
 */
export default function RestaurantStructuredData({
  restaurant,
  reviews,
}: RestaurantStructuredDataProps) {
  const [structuredData, setStructuredData] = useState<any>(null);

  useEffect(() => {
    if (!restaurant) return;

    const restaurantData = restaurant as any;
    const title = restaurantData.title || "Restaurant";
    const description =
      restaurantData.listingDetails?.description ||
      `Discover ${title} on TastyPlates. Read reviews, see photos, and find the perfect dining experience.`;

    const featuredImage =
      restaurantData.featuredImage?.node?.sourceUrl ||
      restaurantData.imageGallery?.[0] ||
      null;

    const address = restaurantData.listingDetails?.googleMapUrl;
    const rating = reviews.length > 0 ? calculateOverallRating(reviews) : null;
    const cuisineTypes =
      restaurantData.palates?.nodes?.map((p: any) => p.name) || [];

    const data = {
      type: "Restaurant" as const,
      title,
      description,
      url: typeof window !== "undefined" ? window.location.href : "",
      image: featuredImage,
      restaurantData: {
        name: title,
        address: address
          ? {
              streetAddress: `${address.streetNumber || ""} ${address.streetName || ""}`.trim(),
              addressLocality: address.city || "",
              addressRegion: address.province || "",
              postalCode: address.postalCode || "",
              addressCountry: address.country || "",
            }
          : undefined,
        telephone: restaurantData.listingDetails?.phoneNumber || undefined,
        priceRange: restaurantData.listingDetails?.priceRange || undefined,
        servesCuisine: cuisineTypes,
        rating: rating
          ? {
              ratingValue: rating.rating,
              reviewCount: rating.count,
            }
          : undefined,
        image: featuredImage,
      },
    };

    setStructuredData(data);
  }, [restaurant, reviews]);

  if (!structuredData) return null;

  return <StructuredData type="Restaurant" data={structuredData} />;
}

