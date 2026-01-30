import { Metadata } from "next";
import { generateMetadata as generateSEOMetadata, siteConfig } from "@/lib/seo";
import { restaurantV2Service } from "@/app/api/v1/services/restaurantV2Service";
import { calculateOverallRating } from "@/utils/reviewUtils";

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
    
    let restaurantData: any = null;

    try {
      const response = await restaurantV2Service.getRestaurantBySlug(slug);
      if (response.data) {
        restaurantData = {
          title: response.data.title,
          listingDetails: {
            description: response.data.content,
            googleMapUrl: response.data.address
          },
          featuredImage: response.data.featured_image_url ? {
            node: { sourceUrl: response.data.featured_image_url }
          } : null,
          imageGallery: response.data.uploaded_images || [],
          palates: {
            nodes: response.data.palates?.map((p: any) => ({ name: p.name || p.slug })) || []
          },
          reviews: { nodes: [] } // Reviews not included in V2 API response yet
        };
      }
    } catch (error) {
      console.error('Failed to fetch restaurant for metadata:', error);
    }

    if (!restaurantData) {
      return generateSEOMetadata({
        title: "Restaurant Not Found",
        description: "The restaurant you're looking for doesn't exist.",
        noindex: true,
      });
    }

    const title = restaurantData.title || "Restaurant";
    const description =
      restaurantData.listingDetails?.description ||
      restaurantData.content ||
      `Discover ${title} on TastyPlates. Read reviews, see photos, and find the perfect dining experience.`;
    
    const featuredImage =
      restaurantData.featuredImage?.node?.sourceUrl ||
      restaurantData.imageGallery?.[0] ||
      null;

    const address = restaurantData.listingDetails?.googleMapUrl || restaurantData.address;
    const formattedAddress = address
      ? `${address.streetNumber || ""} ${address.streetName || ""}, ${address.city || ""}, ${address.state || ""}`.trim()
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

