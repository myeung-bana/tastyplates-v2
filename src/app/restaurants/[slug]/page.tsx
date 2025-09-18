"use client";
import Image from "next/image";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { FiMapPin } from "react-icons/fi";
import { useEffect, useState } from "react";
// Removed unused import
import { RestaurantService } from "@/services/restaurant/restaurantService";
import "@/styles/pages/_restaurant-details.scss";
// Removed unused import
// Removed unused imports
import ReviewModal from "@/components/ReviewModal";
import { FaPen, FaRegHeart, FaHeart } from "react-icons/fa";
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
import FallbackImage from "@/components/ui/Image/FallbackImage";
import { CASH, FLAG, HELMET, PHONE } from "@/constants/images";
import { responseStatusCode as code } from "@/constants/response";
import { Listing } from "@/interfaces/restaurant/restaurant";
import { 
  calculateRatingMetrics, 
  formatRating, 
  getRatingDisplayText,
  RatingMetrics 
} from "@/utils/reviewUtils";
import { GraphQLReview } from "@/types/graphql";

// Removed unused type

// Removed unused function

// Removed unused function

function SaveRestaurantButton({ restaurantSlug }: { restaurantSlug: string }) {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!session || !restaurantSlug || initialized) return;
    const fetchFavoriteListing = async () => {
      try {
        const data = await restaurantService.createFavoriteListing(
          { restaurant_slug: restaurantSlug, action: "check" },
          session?.accessToken
        );

        if (isMounted) {
          setSaved(data.status === "saved");
        }
      } catch (error) {
        console.error("Failed to fetch favorite status:", error);
      } finally {
        if (isMounted) setInitialized(true);
      }
    };

    fetchFavoriteListing();
    return () => { isMounted = false; };
  }, [restaurantSlug, session, initialized]);

  const handleToggle = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    const prevSaved = saved;
    setSaved(prev => !prev);
    window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurantSlug, status: !saved } }));
    const action = saved ? "unsave" : "save";
    try {
      const res: Record<string, unknown> = await restaurantService.createFavoriteListing(
        { restaurant_slug: restaurantSlug, action },
        session?.accessToken, // can be undefined
        false // do not return JSON response
      );
      
      if (res.status === code.success) {
        toast.success(action === "save" ? savedToWishlistSuccess : removedFromWishlistSuccess);
        const data = res as { status: string };
        setSaved(data.status === "saved");
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurantSlug, status: data.status === "saved" } }));
      } else {
        toast.error(favoriteStatusError);
        setSaved(prevSaved);
        window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurantSlug, status: prevSaved } }));
        setError(favoriteStatusError);
      }
      if (!res.ok) throw new Error("Failed to update favorite status");
    } catch {
      toast.error(favoriteStatusError);
      setSaved(prevSaved);
      window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurantSlug, status: prevSaved } }));
      setError(favoriteStatusError);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <>
        <button
          className="restaurant-detail__review-button flex items-center gap-2"
          onClick={() => setShowSignin(true)}
        >
          <FaRegHeart />
          <span className="underline">Save</span>
        </button>
        <SignupModal
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          onOpenSignin={() => {
            setShowSignup(false);
            setShowSignin(true);
          }}
        />
        <SigninModal
          isOpen={showSignin}
          onClose={() => setShowSignin(false)}
          onOpenSignup={() => {
            setShowSignin(false);
            setShowSignup(true);
          }}
        />
      </>
    );
  }

  if (!initialized) {
    return (
      <button className="restaurant-detail__review-button flex items-center gap-2" disabled>
        <span className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
        <span className="underline text-gray-400">Loading…</span>
      </button>
    );
  }

  return (
    <button
      className="restaurant-detail__review-button flex items-center gap-2"
      onClick={handleToggle}
      disabled={loading}
      aria-pressed={saved}
    >
      {saved ? <FaHeart className="text-black" /> : <FaRegHeart />}
      <span className="underline">{saved ? "Saved" : "Save"}</span>
      {error && <span className="text-xs text-red-500 ml-2">{error}</span>}
    </button>
  );
}

const restaurantService = new RestaurantService();

export default function RestaurantDetail() {
  const { data: session } = useSession();
  const [isShowSignup, setIsShowSignup] = useState(false);
  const [isShowSignin, setIsShowSignin] = useState(false);
  const [restaurant, setRestaurant] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [restaurantReviews, setRestaurantReviews] = useState<GraphQLReview[]>([]);
  const [allReviews, setAllReviews] = useState<GraphQLReview[]>([]);
  const [ratingMetrics, setRatingMetrics] = useState<RatingMetrics>({
    overallRating: 0,
    overallCount: 0,
    searchRating: 0,
    searchCount: 0
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const palatesParam = searchParams?.get("ethnic") || null;

  const params = useParams();
  const slug = params?.slug as string;


  useEffect(() => {
    if (!slug) return;
    restaurantService.fetchRestaurantDetails(slug, decodeURIComponent(palatesParam ?? '') )
      .then((data) => {
        if (!data) return notFound();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const restaurantData = data as any;
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
              latitude: restaurantData.listingDetails?.googleMapUrl?.latitude || "",
              longitude: restaurantData.listingDetails?.googleMapUrl?.longitude || "",
              streetAddress: restaurantData.listingDetails?.googleMapUrl?.streetAddress || "",
            },
            latitude: restaurantData.listingDetails?.latitude || "",
            longitude: restaurantData.listingDetails?.longitude || "",
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
        setRestaurant(transformed);
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
      const metrics = calculateRatingMetrics(
        restaurantReviews,
        allReviews,
        palatesParam
      );
      setRatingMetrics(metrics);
    }
  }, [restaurant, restaurantReviews, allReviews, palatesParam]);

  // Removed searchPalateStats and palateStats as they don't exist in Listing interface
  const lat = parseFloat(restaurant?.listingDetails?.googleMapUrl?.latitude || "0");
  const lng = parseFloat(restaurant?.listingDetails?.googleMapUrl?.longitude || "0");
  const address = restaurant?.listingDetails?.googleMapUrl?.streetAddress;

  if (loading) return <RestaurantDetailSkeleton />;
  if (!restaurant) return notFound();


  const handleReviewSubmit = () => {
    // TODO: Implement review submission
  };

  const addReview = () => {
    if (!session?.user) {
      setIsShowSignin(true);
      return;
    }
    router.push(
      PAGE(ADD_REVIEW, [restaurant.slug, restaurant.databaseId?.toString() || "0"])
    );
  }

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
                  <SaveRestaurantButton restaurantSlug={restaurant.slug} />
                </div>
              </div>
              <div className="flex flex-row gap-6">
                <div className="md:rounded-l-3xl relative restaurant-detail__hero w-full max-h-[307px] !h-auto">
                  <FallbackImage
                    src={restaurant.featuredImage?.node.sourceUrl || ""}
                    alt={restaurant.title}
                    fill
                    className="restaurant-detail__image md:rounded-3xl w-full"
                    priority
                  />
                </div>
                <div className="items-center justify-center rounded-3xl text-center w-1/3 hidden md:flex">
                  <div className="w-full">
                    <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 max-w-md bg-white">
                      {lat && lng ? (
                        <div className="cursor-pointer">
                          <RestaurantMap lat={lat} lng={lng} small />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-40 bg-gray-100 text-gray-500">
                          <FiMapPin className="w-5 h-5 mr-2" />
                          <span>Map location not available</span>
                        </div>
                      )}

                      <div className="flex items-start gap-2 p-4">
                        <FiMapPin className="w-5 h-5 text-gray-600 mt-1 shrink-0" />
                        <p className="text-xs md:text-base text-[#31343F] leading-snug text-left line-clamp-3">
                          {address || 'Address not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="restaurant-detail__detail-item">
                    </div>
                    {restaurant.listingDetails?.openingHours && (
                      <div className="restaurant-detail__detail-item" key="opening-hours">
                        <span>🕒 {restaurant.listingDetails?.openingHours}</span>
                      </div>
                    )}
                    {/* Removed fieldMultiCheck90 as it doesn't exist in Listing interface */}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 mt-10 mx-4 md:mx-0">
                <div className="flex flex-col justify-center items-center border border-[#CACACA] rounded-t-2xl lg:rounded-none lg:rounded-l-3xl pt-4 pb-2">
                  <h1 className="text-xs lg:text-base font-bold">Rating</h1>
                  <div className="rating-summary w-full">
                    <div className="rating-column">
                      <h3>Overall Rating</h3>
                      <div className="rating-value">
                        <span className="text-[#E36B00] text-lg md:text-2xl font-medium">
                          {formatRating(ratingMetrics.overallRating)}
                        </span>
                      </div>
                      <span className="review-count">
                        {ratingMetrics.overallCount > 0
                          ? `${ratingMetrics.overallCount} reviews`
                          : "No reviews yet"}
                      </span>
                    </div>
                    
                    <div className="h-[85%] border-l border-[#CACACA]"></div>
                    
                    <div className="rating-column">
                      <h3>Search Rating</h3>
                      <div className="rating-value">
                        <span className="text-[#E36B00] text-lg md:text-2xl font-medium">
                          {formatRating(ratingMetrics.searchRating)}
                        </span>
                      </div>
                      <span className="review-count">
                        {palatesParam 
                          ? (ratingMetrics.searchCount > 0
                              ? `${ratingMetrics.searchCount} reviews from ${palatesParam}`
                              : `No reviews from ${palatesParam}`)
                          : "No search term provided"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-center border border-[#CACACA] rounded-b-2xl lg:rounded-none lg:rounded-r-3xl pt-4 pb-2">
                  <h1 className="text-xs lg:text-base font-bold">Community Recognition</h1>
                  <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 my-5 lg:gap-0 lg:my-0">
                    <div className="flex items-center w-full">
                      <div className="rating-column w-full border-r border-[#CACACA]">
                        <Image
                          src={FLAG}
                          height={40}
                          width={40}
                          className="size-6 md:size-10"
                          alt="Flag icon"
                        />
                        <div className="rating-value">
                          {/* <FiStar className="fill-yellow-500" /> */}
                          <span className="text-lg md:text-xl font-medium">
                            0
                          </span>
                        </div>
                        <span className="text-[10px] lg:text-sm whitespace-pre">Must Revisit</span>
                      </div>
                      {/* <div className="h-4/5 border-l border-[#CACACA]"></div> */}
                      <div className="rating-column w-full lg:border-r border-[#CACACA]">
                        <Image
                          src={PHONE}
                          height={40}
                          width={40}
                          className="size-6 md:size-10"
                          alt="phone icon"
                        />
                        <div className="rating-value">
                          {/* <FiStar className="fill-yellow-500" /> */}
                          <span className="text-lg md:text-xl font-medium">
                            0
                          </span>
                        </div>
                        <span className="text-[10px] lg:text-sm whitespace-pre">Insta-Worthy</span>
                      </div>
                    </div>
                    <div className="flex items-center w-full">
                      <div className="rating-column w-full border-r border-[#CACACA]">
                        <Image
                          src={CASH}
                          height={40}
                          width={40}
                          className="size-6 md:size-10"
                          alt="cash icon"
                        />
                        <div className="rating-value">
                          {/* <FiStar className="fill-yellow-500" /> */}
                          <span className="text-lg md:text-xl font-medium">
                            0
                          </span>
                        </div>
                        <span className="text-[10px] lg:text-sm whitespace-pre">Value for Money</span>
                      </div>
                      {/* <div className="h-4/5 border-l border-[#CACACA]"></div> */}
                      <div className="rating-column w-full">
                        <Image
                          src={HELMET}
                          height={40}
                          width={40}
                          className="size-6 md:size-10"
                          alt="helmet icon"
                        />
                        <div className="rating-value">
                          {/* <FiStar className="fill-yellow-500" /> */}
                          <span className="text-lg md:text-xl font-medium">
                            0
                          </span>
                        </div>
                        <span className="text-[10px] lg:text-sm whitespace-pre">Best Service</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="restaurant-detail__content">
            {/* <div className="restaurant-detail__description">
            <h2>About</h2>
            <p>{restaurant.description}</p>
          </div>

          <div className="restaurant-detail__menu">
            <h2>Menu</h2>
            {restaurant.menu.map((category) => (
              <div key={category.category} className="menu-category">
                <h3 className="menu-category__title">{category.category}</h3>
                <div className="menu-category__items">
                  {category.items.map((item) => (
                    <div key={item.name} className="menu-item">
                      <div className="menu-item__image">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={120}
                          height={120}
                          className="menu-item__img"
                        />
                      </div>
                      <div className="menu-item__content">
                        <h4 className="menu-item__name">{item.name}</h4>
                        <p className="menu-item__description">
                          {item.description}
                        </p>
                        <span className="menu-item__price">${item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div> */}
            <div className="restaurant-detail__reviews">
              <RestaurantReviews 
                restaurantId={restaurant.databaseId || 0} 
                onReviewsUpdate={(reviews) => {
                  setRestaurantReviews(reviews);
                  // For now, we'll use the same reviews for allReviews
                  // In a real implementation, you'd fetch all reviews from the system
                  setAllReviews(reviews);
                }}
              />
            </div>
          </div>
        </div>

        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          restaurantId={restaurant.id}
          onSubmit={handleReviewSubmit}
        />
      </div>
    </div>
  );
}
