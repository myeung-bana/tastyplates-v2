import { Metadata } from "next";
import { generateMetadata as generateSEOMetadata, siteConfig } from "@/lib/seo";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { calculateOverallRating } from "@/utils/reviewUtils";

const restaurantService = new RestaurantService();

/**
 * Generate metadata for restaurant detail pages
 * This is called by Next.js to generate SEO metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const restaurant = await restaurantService.fetchRestaurantDetails(
      slug,
      ""
    );

    if (!restaurant) {
      return generateSEOMetadata({
        title: "Restaurant Not Found",
        description: "The restaurant you're looking for doesn't exist.",
        noindex: true,
      });
    }

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
    const formattedAddress = address
      ? `${address.streetNumber || ""} ${address.streetName || ""}, ${address.city || ""}, ${address.province || ""}`.trim()
      : undefined;

    const reviews = restaurantData.reviews?.nodes || [];
    const rating = reviews.length > 0
      ? calculateOverallRating(reviews)
      : null;

    const cuisineTypes =
      restaurantData.palates?.nodes?.map((p: any) => p.name) || [];

    return generateSEOMetadata({
      title: title,
      description: description,
      canonical: `${siteConfig.url}/restaurants/${slug}`,
      image: featuredImage,
      type: "restaurant",
      restaurantData: {
        name: title,
        address: formattedAddress,
        rating: rating?.rating || undefined,
        priceRange: restaurantData.listingDetails?.priceRange || undefined,
        cuisine: cuisineTypes,
        image: featuredImage,
      },
      tags: [...cuisineTypes, "restaurant", "dining", "food"],
    });
  } catch (error) {
    console.error("Error generating restaurant metadata:", error);
    return generateSEOMetadata({
      title: "Restaurant",
      description: "Discover restaurants on TastyPlates.",
    });
  }
}

