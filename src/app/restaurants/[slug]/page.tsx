"use client";
import Image from "next/image";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { FiMapPin } from "react-icons/fi";
import { FaPen, FaRegHeart, FaHeart } from "react-icons/fa";
import { useEffect, useState, useCallback, useMemo } from "react";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import "@/styles/pages/_restaurant-details-v2.scss";
import RestaurantReviews from "@/components/RestaurantReviews";
import RestaurantDetailSkeleton from "@/components/RestaurantDetailSkeleton";
import RestaurantMap from "@/components/Restaurant/Details/RestaurantMap";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SignupModal from "@/components/SignupModal";
import SigninModal from "@/components/SigninModal";
import CheckInRestaurantButton from "@/components/CheckInRestaurantButton";
import { ADD_REVIEW } from "@/constants/pages";
import { PAGE } from "@/lib/utils";
import toast from "react-hot-toast";
import { favoriteStatusError, removedFromWishlistSuccess, savedToWishlistSuccess } from "@/constants/messages";
import { Listing } from "@/interfaces/restaurant/restaurant";
import { 
  calculateRatingMetrics, 
  type RatingMetrics,
  calculateCommunityRecognitionMetrics,
  type CommunityRecognitionMetrics
} from "@/utils/reviewUtils";
import { getBestAddress } from "@/utils/addressUtils";
import { GraphQLReview } from "@/types/graphql";
import ImageGallery from "@/components/Restaurant/ImageGallery";
import RatingSection from "@/components/Restaurant/RatingSection";
import CommunityRecognitionSection from "@/components/Restaurant/CommunityRecognitionSection";

// Save Restaurant Button Component
function SaveRestaurantButton({ restaurantSlug }: { restaurantSlug: string }) {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restaurantService = useMemo(() => new RestaurantService(), []);

  const checkFavoriteStatus = useCallback(async () => {
    if (!session?.accessToken || !session?.user?.id) return;
    try {
      const response = await restaurantService.fetchFavoritingListing(session.user.id, session.accessToken);
      setSaved(Boolean((response as { isFavorite?: boolean }).isFavorite));
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  }, [session?.accessToken, session?.user?.id, restaurantService]);

  const toggleFavorite = useCallback(async () => {
    if (!session?.user) {
      // Redirect to signin or show signin modal
      window.location.href = '/auth/signin';
      return;
    }

    if (!session?.accessToken) {
      setError("Authentication required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (saved) {
        await restaurantService.createFavoriteListing(
          { restaurant_slug: restaurantSlug, action: "remove" },
          session.accessToken
        );
        setSaved(false);
        toast.success(removedFromWishlistSuccess);
      } else {
        await restaurantService.createFavoriteListing(
          { restaurant_slug: restaurantSlug, action: "add" },
          session.accessToken
        );
        setSaved(true);
        toast.success(savedToWishlistSuccess);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setError(favoriteStatusError);
    } finally {
      setLoading(false);
    }
  }, [saved, session?.user, session?.accessToken, restaurantSlug, restaurantService]);

  useEffect(() => {
    if (session?.user && !initialized) {
      checkFavoriteStatus();
      setInitialized(true);
    }
  }, [session?.user, initialized, checkFavoriteStatus]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : saved ? (
        <FaHeart className="text-red-500" />
      ) : (
        <FaRegHeart className="text-gray-500" />
      )}
      <span className="text-sm font-medium">
        {saved ? "Saved" : "Save"}
      </span>
    </button>
  );
}

// Helper function to get restaurant images
function getRestaurantImages(restaurant: Listing): string[] {
  const images: string[] = [];
  
  // Add featured image if available
  if (restaurant.featuredImage?.node?.sourceUrl) {
    images.push(restaurant.featuredImage.node.sourceUrl);
  }
  
  // Add placeholder images for demonstration
  for (let i = 1; i <= 6; i++) {
    images.push(`/placeholder-restaurant-${i}.jpg`);
  }
  
  return images;
}


// Main Component
const restaurantService = new RestaurantService();

export default function RestaurantDetail() {
  const { data: session } = useSession();
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [restaurant, setRestaurant] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurantReviews, setRestaurantReviews] = useState<GraphQLReview[]>([]);
  const [allReviews, setAllReviews] = useState<GraphQLReview[]>([]);
  const [ratingMetrics, setRatingMetrics] = useState<RatingMetrics>({
    overallRating: 0,
    overallCount: 0,
    searchRating: 0,
    searchCount: 0,
    myPreferenceRating: 0,
    myPreferenceCount: 0
  });
  const [communityRecognitionMetrics, setCommunityRecognitionMetrics] = useState<CommunityRecognitionMetrics>({
    mustRevisit: 0,
    instaWorthy: 0,
    valueForMoney: 0,
    bestService: 0
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const palatesParam = searchParams?.get("ethnic") || null;

  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) return;
    restaurantService.fetchRestaurantDetails(slug, decodeURIComponent(palatesParam ?? ''))
      .then((data) => {
        if (!data) return notFound();
        const restaurantData = data as Record<string, unknown> & {
          palates?: { nodes?: Array<{ name: string }> };
          listingDetails?: {
            googleMapUrl?: {
              streetAddress?: string;
              streetNumber?: string;
              streetName?: string;
              city?: string;
              state?: string;
              stateShort?: string;
              country?: string;
              countryShort?: string;
              postCode?: string;
              latitude?: string;
              longitude?: string;
              placeId?: string;
              zoom?: number;
            };
            phone?: string;
            openingHours?: string;
            menuUrl?: string;
          };
          listingCategories?: { nodes?: Array<{ name: string }> };
          countries?: { nodes?: Array<{ name: string }> };
          featuredImage?: { node?: { sourceUrl?: string } };
        };
        const transformed = {
          id: restaurantData.id,
          slug: restaurantData.slug,
          title: restaurantData.title,
          content: restaurantData.content || "",
          averageRating: restaurantData.averageRating || 0,
          status: "published",
          listingStreet: restaurantData.listingStreet || "",
          priceRange: restaurantData.priceRange || "$$",
          palates: {
            nodes: restaurantData.palates?.nodes || []
          },
          databaseId: restaurantData.databaseId,
          listingDetails: {
            googleMapUrl: {
              streetAddress: restaurantData.listingDetails?.googleMapUrl?.streetAddress || "",
              streetNumber: restaurantData.listingDetails?.googleMapUrl?.streetNumber || "",
              streetName: restaurantData.listingDetails?.googleMapUrl?.streetName || "",
              city: restaurantData.listingDetails?.googleMapUrl?.city || "",
              state: restaurantData.listingDetails?.googleMapUrl?.state || "",
              stateShort: restaurantData.listingDetails?.googleMapUrl?.stateShort || "",
              country: restaurantData.listingDetails?.googleMapUrl?.country || "",
              countryShort: restaurantData.listingDetails?.googleMapUrl?.countryShort || "",
              postCode: restaurantData.listingDetails?.googleMapUrl?.postCode || "",
              latitude: restaurantData.listingDetails?.googleMapUrl?.latitude || "",
              longitude: restaurantData.listingDetails?.googleMapUrl?.longitude || "",
              placeId: restaurantData.listingDetails?.googleMapUrl?.placeId || "",
              zoom: restaurantData.listingDetails?.googleMapUrl?.zoom || 0,
            },
            latitude: restaurantData.listingDetails?.googleMapUrl?.latitude || "",
            longitude: restaurantData.listingDetails?.googleMapUrl?.longitude || "",
            menuUrl: restaurantData.listingDetails?.menuUrl || "",
            openingHours: restaurantData.listingDetails?.openingHours || "",
            phone: restaurantData.listingDetails?.phone || "",
          },
          featuredImage: restaurantData.featuredImage,
          listingCategories: {
            nodes: restaurantData.listingCategories?.nodes || []
          },
          countries: {
            nodes: restaurantData.countries?.nodes || []
          },
          cuisines: restaurantData.cuisines || [],
          isFavorite: restaurantData.isFavorite || false,
          ratingsCount: restaurantData.ratingsCount || 0,
        };
        setRestaurant(transformed as Listing);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching restaurant:", err);
        setLoading(false);
      });
  }, [slug, palatesParam]);

  // Calculate rating metrics when data changes
  useEffect(() => {
    if (restaurant && restaurantReviews.length > 0) {
      const userPalates = session?.user?.palates || null;
      const metrics = calculateRatingMetrics(
        restaurantReviews,
        allReviews,
        palatesParam,
        userPalates
      );
      setRatingMetrics(metrics);

      // Calculate community recognition metrics
      const recognitionMetrics = calculateCommunityRecognitionMetrics(restaurantReviews);
      setCommunityRecognitionMetrics(recognitionMetrics);
    }
  }, [restaurant, restaurantReviews, allReviews, palatesParam, session?.user?.palates]);

  const addReview = () => {
    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }
    router.push(
      PAGE(ADD_REVIEW, [restaurant?.slug || "", restaurant?.databaseId?.toString() || "0"])
    );
  };

  // Removed searchPalateStats and palateStats as they don't exist in Listing interface
  const lat = parseFloat(restaurant?.listingDetails?.googleMapUrl?.latitude || "0");
  const lng = parseFloat(restaurant?.listingDetails?.googleMapUrl?.longitude || "0");
  const address = getBestAddress(
    restaurant?.listingDetails?.googleMapUrl, 
    restaurant?.listingStreet, 
    'No address available'
  );

  if (loading) return <RestaurantDetailSkeleton />;
  if (!restaurant) return notFound();

  return (
    <div className="restaurant-detail mt-32 md:mt-20">
      <div className="restaurant-detail__container !pt-0">
        <div className="restaurant-detail__header">
          <div className="restaurant-detail__info">
            <div className="flex flex-col-reverse md:flex-col">
              <div className="flex flex-col md:flex-row justify-between px-4 md:px-0">
                <div className="mt-6 md:mt-0">
                  <h1 className="restaurant-detail__name leading-7">{restaurant.title}</h1>
                  <div className="restaurant-detail__meta">
                    <div className="restaurant-detail__cuisine">
                      {restaurant.palates.nodes.map((palate: { name: string }, index: number) => (
                        <div className="flex items-center gap-2" key={`palate-${index}`}>
                          {index > 0 && <span>&#8226;</span>}
                          <span className="cuisine-tag hover:!bg-transparent">{palate.name}</span>
                        </div>
                      ))}
                    </div>
                    &#8226;
                    <div className="restaurant-detail__price">
                      <span>{restaurant.priceRange}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row flex-nowrap gap-4">
                  <CheckInRestaurantButton restaurantSlug={restaurant.slug} />
                  <button onClick={addReview} className="flex items-center gap-2 hover:underline">
                    <FaPen className="size-4 md:size-5" />
                    <span className="underline">Write a Review</span>
                  </button>
                  <SaveRestaurantButton restaurantSlug={restaurant.slug} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Main Content (3/5 width) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured Image */}
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
              <Image
                src={restaurant.featuredImage?.node?.sourceUrl || "/placeholder-restaurant.jpg"}
                alt={restaurant.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Image Gallery */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <ImageGallery 
                images={getRestaurantImages(restaurant)} 
                restaurantTitle={restaurant.title} 
              />
            </div>

            {/* Description Section */}
            {restaurant.content && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">About</h3>
                <div className="text-gray-700 leading-relaxed">
                  {restaurant.content}
                </div>
              </div>
            )}

            {/* Rating Section */}
            <div>
              <RatingSection ratingMetrics={ratingMetrics} palatesParam={palatesParam} />
            </div>

            {/* Community Recognition Section */}
            <div>
              <CommunityRecognitionSection metrics={communityRecognitionMetrics} />
            </div>
          </div>

          {/* Right Column - Sticky Sidebar (2/5 width) */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
            {/* Map and Address */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Location</h3>
              <div className="space-y-4">
                {lat && lng ? (
                  <div className="h-64 rounded-xl overflow-hidden">
                    <RestaurantMap lat={lat} lng={lng} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-500 rounded-xl">
                    <FiMapPin className="w-5 h-5 mr-2" />
                    <span>Map location not available</span>
                  </div>
                )}
                
                {address && address !== 'No address available' && (
                  <div className="flex items-start gap-3 pt-2">
                    <FiMapPin className="text-gray-500 mt-1" />
                    <span className="text-gray-700">{address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">           
                <button 
                  onClick={addReview}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <FaPen className="w-4 h-4" />
                  <span className="text-white">Write a Review</span>
                </button>
                
              </div>
            </div>

            {/* Restaurant Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Restaurant Details</h3>
              <div className="space-y-3">
                {restaurant.listingDetails?.openingHours && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">🕒</span>
                    <span className="text-gray-700">{restaurant.listingDetails.openingHours}</span>
                  </div>
                )}
                
                {restaurant.listingDetails?.phone && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">📞</span>
                    <span className="text-gray-700">{restaurant.listingDetails.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">💰</span>
                  <span className="text-gray-700">{restaurant.priceRange}</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Full-Width Reviews Section */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold mb-6">Reviews</h3>
            <RestaurantReviews 
              restaurantId={restaurant.databaseId || 0} 
              onReviewsUpdate={(reviews) => {
                setRestaurantReviews(reviews);
                setAllReviews(reviews);
              }}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <SigninModal
        isOpen={isShowSignin}
        onClose={() => setIsShowSignin(false)}
        onOpenSignup={() => {
          setIsShowSignin(false);
          setIsShowSignup(true);
        }}
      />
      <SignupModal
        isOpen={isShowSignup}
        onClose={() => setIsShowSignup(false)}
        onOpenSignin={() => {
          setIsShowSignup(true);
          setIsShowSignin(false);
        }}
      />
    </div>
  );
}