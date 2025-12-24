"use client";
import Image from "next/image";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { restaurantV2Service } from "@/app/api/v1/services/restaurantV2Service";
import { transformRestaurantV2ToListing } from "@/utils/restaurantTransformers";
import { isFeatureEnabled } from "@/constants/featureFlags";
import { reviewV2Service } from '@/app/api/v1/services/reviewV2Service';
import { transformReviewV2ToGraphQLReview } from '@/utils/reviewTransformers';
import "@/styles/pages/_restaurant-details-v2.scss";
import RestaurantReviews from "@/components/Restaurant/RestaurantReviews";
import RestaurantReviewsMobile from "@/components/Restaurant/RestaurantReviewsMobile";
import RestaurantReviewsViewerModal from "@/components/Restaurant/RestaurantReviewsViewerModal";
import RestaurantDetailSkeleton from "@/components/ui/Skeleton/RestaurantDetailSkeleton";
import { useIsMobile } from "@/utils/deviceUtils";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
import { useRouter } from "next/navigation";
import SignupModal from "@/components/auth/SignupModal";
import SigninModal from "@/components/auth/SigninModal";
import { TASTYSTUDIO_ADD_REVIEW_CREATE } from "@/constants/pages";
import { Listing } from "@/interfaces/restaurant/restaurant";
import { 
  calculateRatingMetrics, 
  type RatingMetrics,
  calculateCommunityRecognitionMetrics,
  type CommunityRecognitionMetrics,
  calculateOverallRating
} from "@/utils/reviewUtils";
import { GraphQLReview } from "@/types/graphql";
import ImageGallery from "@/components/Restaurant/ImageGallery";
import RatingSection from "@/components/Restaurant/RatingSection";
import CommunityRecognitionSection from "@/components/Restaurant/CommunityRecognitionSection";
import RestaurantHeader from "@/components/Restaurant/Details/RestaurantHeader";
import RestaurantLocationSection from "@/components/Restaurant/Details/RestaurantLocationSection";
import RestaurantQuickActions from "@/components/Restaurant/Details/RestaurantQuickActions";
import RestaurantDetailsSection from "@/components/Restaurant/Details/RestaurantDetailsSection";
import Breadcrumb from "@/components/common/Breadcrumb";
import { RESTAURANTS } from "@/constants/pages";


// Helper function to get restaurant images
function getRestaurantImages(restaurant: Listing): string[] {
  const images: string[] = [];
  
  // First, check if imageGallery exists and has images
  if (restaurant.imageGallery && restaurant.imageGallery.length > 0) {
    return restaurant.imageGallery;
  }
  
  // Fallback: use only featured image if gallery is empty
  if (restaurant.featuredImage?.node?.sourceUrl) {
    images.push(restaurant.featuredImage.node.sourceUrl);
  }
  
  return images;
}

// Helper function to transform WordPress GraphQL data to Listing format
function transformWordPressToListing(restaurantData: any): Listing {
  return {
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
            imageGallery: restaurantData.imageGallery || [],
            listingCategories: {
              nodes: restaurantData.listingCategories?.nodes || []
            },
            countries: {
              nodes: restaurantData.countries?.nodes || []
            },
            cuisines: restaurantData.cuisines || [],
            isFavorite: restaurantData.isFavorite || false,
            ratingsCount: restaurantData.ratingsCount || 0,
          } as Listing;
}


// Main Component
const restaurantService = new RestaurantService();

export default function RestaurantDetail() {
  const { user } = useFirebaseSession();
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [restaurant, setRestaurant] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<GraphQLReview[]>([]);
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
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const palatesParam = searchParams?.get("ethnic") || null;

  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) return;
    
    const useV2API = isFeatureEnabled('USE_RESTAURANT_V2_API');
    
    const fetchRestaurant = async () => {
      try {
        let transformed: Listing | null = null;

        if (useV2API) {
          // Use new Hasura-based API
          try {
            const response = await restaurantV2Service.getRestaurantBySlug(slug);
            
            if (!response.data) {
              return notFound();
            }

            // Transform Hasura format to component format
            transformed = transformRestaurantV2ToListing(response.data);
            console.log('✅ V2 API: Fetched restaurant by slug:', slug);
          } catch (v2Error) {
            console.error('V2 API failed, falling back to V1:', v2Error);
            // Fallback to V1 API if V2 fails
            const data = await restaurantService.fetchRestaurantDetails(slug, decodeURIComponent(palatesParam ?? ''));
            if (!data) return notFound();
            transformed = transformWordPressToListing(data);
          }
        } else {
          // Use existing WordPress GraphQL API
          const data = await restaurantService.fetchRestaurantDetails(slug, decodeURIComponent(palatesParam ?? ''));
          if (!data) return notFound();
          transformed = transformWordPressToListing(data);
        }

        if (transformed) {
          setRestaurant(transformed);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching restaurant:", err);
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [slug, palatesParam]);

  // Calculate rating metrics when data changes
  useEffect(() => {
    if (restaurant && reviews.length > 0) {
      const userPalates = user?.palates || null;
      const metrics = calculateRatingMetrics(
        reviews,
        reviews,
        palatesParam,
        userPalates
      );
      setRatingMetrics(metrics);

      // Calculate community recognition metrics
      const recognitionMetrics = calculateCommunityRecognitionMetrics(reviews);
      setCommunityRecognitionMetrics(recognitionMetrics);
    }
  }, [restaurant, reviews, palatesParam, user?.palates]);

  // Fetch restaurant reviews from new V2 API
  useEffect(() => {
    if (!restaurant?.id) return; // restaurant.id is the UUID

    const fetchRestaurantReviews = async () => {
      try {
        let allFetched: GraphQLReview[] = [];
        let offset = 0;
        const limit = 50;
        let hasMore = true;

        // Fetch all reviews using offset-based pagination
        while (hasMore) {
          const response = await reviewV2Service.getReviewsByRestaurant(restaurant.id, {
            limit,
            offset
          });

          // Transform ReviewV2 to GraphQLReview
          const transformed = response.reviews.map((review) => 
            transformReviewV2ToGraphQLReview(review, restaurant.databaseId)
          );

          allFetched = allFetched.concat(transformed);
          hasMore = response.hasMore || false;
          offset += transformed.length;

          // Safety check to prevent infinite loops
          if (transformed.length === 0) break;
        }

        setReviews(allFetched);
      } catch (error) {
        console.error('Error fetching restaurant reviews:', error);
        setReviews([]);
      }
    };

    fetchRestaurantReviews();
  }, [restaurant?.id, restaurant?.databaseId]);

  const addReview = () => {
    if (!user) {
      setIsShowSignin(true);
      return;
    }
    const slug = restaurant?.slug || "";
    if (slug) {
      router.push(`${TASTYSTUDIO_ADD_REVIEW_CREATE}?slug=${encodeURIComponent(slug)}`);
    } else {
      // Fallback to search page if no slug
      router.push('/tastystudio/add-review');
    }
  };

  const reviewCount = useMemo(() => {
    return calculateOverallRating(reviews).count;
  }, [reviews]);

  if (loading) return <RestaurantDetailSkeleton />;
  if (!restaurant) return notFound();

  return (
    <>
    <div className="restaurant-detail mt-4 md:mt-20 font-neusans">
      <div className="restaurant-detail__container !pt-0">
        {/* Breadcrumb */}
        <div className="px-2 mb-4 md:mb-6">
          <Breadcrumb 
            items={[
              { label: "Restaurants", href: RESTAURANTS },
              { label: restaurant.title }
            ]}
            showHomeIcon={true}
          />
        </div>
        
        {/* Mobile: Gallery First */}
        <div className="md:hidden">
          {getRestaurantImages(restaurant).length > 0 ? (
            <div className="relative h-64 rounded-2xl overflow-hidden mx-2 mb-6">
              <Image
                src={restaurant.featuredImage?.node?.sourceUrl || "/placeholder-restaurant.jpg"}
                alt={restaurant.title}
                fill
                className="object-cover"
                priority
              />
              <ImageGallery 
                images={getRestaurantImages(restaurant)} 
                restaurantTitle={restaurant.title} 
              />
            </div>
          ) : (
            <div className="h-64 rounded-2xl mx-2 mb-6 bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500 text-lg font-medium">No Photos Available</span>
            </div>
          )}
        </div>

        <RestaurantHeader
          restaurant={restaurant}
          onAddReview={addReview}
          onShowSignin={() => setIsShowSignin(true)}
        />

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 px-2">
          {/* Left Column - Main Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-8">
              {/* Desktop: Featured Image */}
              {getRestaurantImages(restaurant).length > 0 ? (
                <div className="hidden md:block relative h-64 md:h-80 rounded-2xl overflow-hidden">
                  <Image
                    src={restaurant.featuredImage?.node?.sourceUrl || "/placeholder-restaurant.jpg"}
                    alt={restaurant.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <ImageGallery 
                    images={getRestaurantImages(restaurant)} 
                    restaurantTitle={restaurant.title} 
                  />
                </div>
              ) : (
                <div className="hidden md:block h-64 md:h-80 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-500 text-xl font-neusans">No Photos Available</span>
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

              {/* Restaurant Location Section - Wide Map */}
              <div>
                <RestaurantLocationSection restaurant={restaurant} isWide={true} />
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Sidebar (max 375px) */}
          <div className="lg:w-[375px] lg:flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              <RestaurantDetailsSection restaurant={restaurant} />
              <RestaurantQuickActions onAddReview={addReview} />
            </div>
          </div>
        </div>

        {/* Full-Width Reviews Section */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            {/* Desktop view */}
            <div className={isMobile ? "hidden" : ""}>
              <RestaurantReviews 
                restaurantId={restaurant.databaseId || 0}
                restaurantUuid={restaurant.id}
                reviews={reviews}
                reviewCount={reviewCount}
                onReviewsUpdate={setReviews}
              />
            </div>
            {/* Mobile view */}
            {isMobile && (
              <RestaurantReviewsMobile
                reviews={reviews}
                restaurantId={restaurant.databaseId || 0}
                onOpenModal={() => setShowReviewsModal(true)}
              />
            )}
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
      
      {/* Restaurant Reviews Modal */}
      {isMobile && (
        <RestaurantReviewsViewerModal
          reviews={reviews}
          isOpen={showReviewsModal}
          onClose={() => setShowReviewsModal(false)}
          initialIndex={0}
          restaurantId={restaurant.databaseId || 0}
        />
      )}
      </div>
    </div>
    </>
  );
}