"use client";
import Image from "next/image";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { restaurantV2Service } from "@/app/api/v1/services/restaurantV2Service";
import { transformRestaurantV2ToListing } from "@/utils/restaurantTransformers";
import { reviewV2Service } from '@/app/api/v1/services/reviewV2Service';
import { transformReviewV2ToGraphQLReview } from '@/utils/reviewTransformers';
import "@/styles/pages/_restaurant-details-v2.scss";
import RestaurantReviews from "@/components/Restaurant/RestaurantReviews";
import RestaurantReviewsMobile from "@/components/Restaurant/RestaurantReviewsMobile";
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
// Main Component

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
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const palatesParam = searchParams?.get("ethnic") || null;

  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) return;
    
    const fetchRestaurant = async () => {
      try {
        const response = await restaurantV2Service.getRestaurantBySlug(slug);
        
        if (!response.data) {
          return notFound();
        }

        // Transform Hasura format to component format
        const transformed = transformRestaurantV2ToListing(response.data);

        setRestaurant(transformed);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch restaurant:', err);
        setLoading(false);
        return notFound();
      }
    };

    fetchRestaurant();
  }, [slug]);

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
        
        {/* Full-Width Gallery Section */}
        {getRestaurantImages(restaurant).length > 0 ? (
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mx-2 mb-8 group">
            <Image
              src={restaurant.featuredImage?.node?.sourceUrl || "/placeholder-restaurant.jpg"}
              alt={restaurant.title}
              fill
              className="object-cover"
              priority
            />
            {/* See All Photos Badge */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md flex items-center gap-2 cursor-pointer hover:bg-white transition-all z-10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium font-neusans">See All Photos</span>
            </div>
            <ImageGallery 
              images={getRestaurantImages(restaurant)} 
              restaurantTitle={restaurant.title} 
            />
          </div>
        ) : (
          <div className="h-64 md:h-96 rounded-2xl mx-2 mb-8 bg-gray-100 flex items-center justify-center">
            <span className="text-gray-500 text-lg md:text-xl font-medium text-center">No Photos Available</span>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 px-2">
          {/* Left Column - Main Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-4 md:space-y-8">
              {/* Restaurant Header - Title, Info, Actions */}
              <RestaurantHeader
                restaurant={restaurant}
                onAddReview={addReview}
                onShowSignin={() => setIsShowSignin(true)}
              />

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
              <RestaurantQuickActions onAddReview={addReview} restaurant={restaurant} />
            </div>
          </div>
        </div>

        {/* Full-Width Reviews Section */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl p-6 md:shadow-sm md:border md:border-gray-200">
            {/* Desktop view */}
            <div className={isMobile ? "hidden" : ""}>
              <RestaurantReviews 
                restaurantId={restaurant.databaseId || 0}
                restaurantUuid={restaurant.id}
                restaurantTitle={restaurant.title || ""}
                restaurantSlug={restaurant.slug || ""}
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
                restaurantUuid={restaurant.id}
                restaurantSlug={restaurant.slug || slug}
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
      
      </div>
    </div>
    </>
  );
}