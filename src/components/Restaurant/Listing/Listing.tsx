// Listing.tsx
"use client";
import React, { FormEvent, useEffect, useState, useCallback } from "react";
import RestaurantCard from "@/components/Restaurant/RestaurantCard";
import "@/styles/pages/_restaurants.scss";
// import { RestaurantDummy, restaurantsDummy } from "@/data/dummyRestaurants";
import { FiSearch } from "react-icons/fi";
import ListingCard from "./ListingCard";
import DraftReviewCard from "./DraftReviewCard";
import type { DraftReviewData } from "./DraftReviewCard";
import ReviewModal from "@/components/ui/Modal/ReviewModal";
import SkeletonCard from "@/components/ui/Skeleton/SkeletonCard";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { reviewV2Service, ReviewV2 } from "@/app/api/v1/services/reviewV2Service";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";
// Using DraftReviewData from DraftReviewCard instead
import SkeletonListingCard from "@/components/ui/Skeleton/SkeletonListingCard";
import { deleteDraftError, deleteDraftSuccess } from "@/constants/messages";
import toast from 'react-hot-toast';
import { useDebounce } from "use-debounce"; // Import useDebounce
import Link from "next/link";
import { LISTING_EXPLANATION } from "@/constants/pages";
import { DEFAULT_RESTAURANT_IMAGE } from "@/constants/images";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  countries: string;
  priceRange: string;
  databaseId: number;
  palatesNames?: string[];
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
  averageRating?: number;
  ratingsCount?: number;
  status?: string;
}

const restaurantService = new RestaurantService();

const ListingPage = () => {
  const { user, firebaseUser } = useFirebaseSession();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300); // Debounced search term
  const [listing, setListing] = useState<string>("");
  const [isShowDelete, setIsShowDelete] = useState<boolean>(false)
  const [loadingVisited, setLoadingVisited] = useState(true);
  const [loading, setLoading] = useState(false); // Changed initial state to false
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reviewDrafts, setReviewDrafts] = useState<DraftReviewData[]>([]);
  const [allDrafts, setAllDrafts] = useState<DraftReviewData[]>([]);
  const [draftToDelete, setDraftToDelete] = useState<DraftReviewData | null>(null);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [recentlyVisitedRestaurants, setRecentlyVisitedRestaurants] = useState<Restaurant[]>([]);
  // Map numeric IDs to UUIDs for deletion
  const [draftIdToUuidMap, setDraftIdToUuidMap] = useState<Map<number, string>>(new Map());

  // Helper: transform GraphQL node to Restaurant
  const transformNodes = useCallback((nodes: Record<string, unknown>[]): Restaurant[] => {
    return nodes.map((item: Record<string, unknown>) => {
      // Extract palates names from palates.nodes array
      const palatesNodes = ((item.palates as Record<string, unknown>)?.nodes as Record<string, unknown>[]) || [];
      const palatesNames = palatesNodes.map((p: Record<string, unknown>) => p.name as string).filter(Boolean);

      // Extract googleMapUrl from listingDetails
      const listingDetails = (item.listingDetails as Record<string, unknown>) || {};
      const googleMapUrl = (listingDetails.googleMapUrl as Record<string, unknown>) || {};

      // Extract countries from countries.nodes or use googleMapUrl
      const countriesNodes = ((item.countries as Record<string, unknown>)?.nodes as Record<string, unknown>[]) || [];
      const countries = countriesNodes.map((c: Record<string, unknown>) => c.name as string).join(", ") || 
                       ((googleMapUrl.country as string) || "Default Location");

      return {
        id: item.id as string,
        databaseId: (item.databaseId as number) || 0,
        slug: item.slug as string,
        name: item.title as string,
        image: ((item.featuredImage as Record<string, unknown>)?.node as Record<string, unknown>)?.sourceUrl as string || DEFAULT_RESTAURANT_IMAGE,
        rating: parseFloat((item.averageRating as string) || "0") || 0,
        cuisineNames: palatesNames,
        countries: countries,
        priceRange: (item.priceRange as string) || "",
        // Add fields needed by RestaurantCard component
        palatesNames: palatesNames,
        googleMapUrl: Object.keys(googleMapUrl).length > 0 ? {
          streetAddress: googleMapUrl.streetAddress as string | undefined,
          streetNumber: googleMapUrl.streetNumber as string | undefined,
          streetName: googleMapUrl.streetName as string | undefined,
          city: googleMapUrl.city as string | undefined,
          state: googleMapUrl.state as string | undefined,
          stateShort: googleMapUrl.stateShort as string | undefined,
          country: googleMapUrl.country as string | undefined,
          countryShort: googleMapUrl.countryShort as string | undefined,
          postCode: googleMapUrl.postCode as string | undefined,
          latitude: googleMapUrl.latitude as string | undefined,
          longitude: googleMapUrl.longitude as string | undefined,
          placeId: googleMapUrl.placeId as string | undefined,
          zoom: googleMapUrl.zoom as number | undefined,
        } : undefined,
        averageRating: parseFloat((item.averageRating as string) || "0") || 0,
        ratingsCount: (item.ratingsCount as number) || 0,
        status: item.status as string | undefined,
      };
    });
  }, []);

  // Transform ReviewV2 to DraftReviewData format
  const transformReviewDrafts = useCallback((reviews: ReviewV2[]): DraftReviewData[] => {
    return reviews.map((review: ReviewV2) => {
      // Convert UUID to numeric ID for compatibility (using hash of first 8 chars)
      const numericId = parseInt(review.id.replace(/-/g, '').substring(0, 8), 16) % 2147483647;
      
      // Get restaurant database ID
      const restaurantDbId = review.restaurant?.id || 0;
      
      // Get author database ID (convert UUID to number)
      const authorDbId = review.author?.id 
        ? parseInt(review.author.id.replace(/-/g, '').substring(0, 8), 16) % 2147483647
        : 0;
      
      // Transform images from ReviewV2 format to DraftReviewData format
      const reviewImages = (review.images || []).map((img: any, index: number) => {
        const imageId = img.id || `${review.id}-${index}`;
        const numericImageId = typeof imageId === 'string' && imageId.includes('-')
          ? parseInt(imageId.replace(/-/g, '').substring(0, 8), 16) % 2147483647
          : (typeof imageId === 'number' ? imageId : parseInt(String(imageId), 10) || 0);
        
        return {
          databaseId: numericImageId,
          id: String(imageId),
          sourceUrl: typeof img === 'string' ? img : (img.url || img.sourceUrl || '')
        };
      });
      
      // Get author name and avatar
      const authorName = review.author?.display_name || review.author?.username || 'Unknown User';
      const authorAvatar = review.author?.profile_image 
        ? (typeof review.author.profile_image === 'string' 
            ? review.author.profile_image 
            : (review.author.profile_image as any)?.url || '')
        : undefined;
      
      // Format date
      const date = review.published_at || review.created_at;
      
      // Generate link (using restaurant slug if available)
      const restaurantSlug = review.restaurant?.slug || 'restaurant';
      const link = `/restaurants/${restaurantSlug}`;
      
      return {
        id: numericId,
        post: restaurantDbId,
        author: authorDbId,
        authorName: authorName,
        authorAvatar: authorAvatar,
        content: {
          rendered: review.content || "",
          raw: review.content || ""
        },
        date: date,
        link: link,
        status: review.status || 'draft',
        type: 'draft',
        recognitions: review.recognitions || [],
        reviewImages: reviewImages,
        reviewMainTitle: review.title || '',
        reviewStars: String(review.rating || 0),
        uuid: review.id, // Add UUID for navigation
        restaurantSlug: restaurantSlug, // Add restaurant slug for navigation
      };
    });
  }, []);

  const fetchRestaurants = useCallback(async (search: string, first = 8, after: string | null = null) => {
    setLoading(true);
    try {
      const data = await restaurantService.fetchAllRestaurants(search, first, after);
      const transformed = transformNodes(data.nodes);

      setRestaurants(prev => {
        if (!after) {
          return transformed;
        }
        const all = [...prev, ...transformed];
        const uniqueMap = new Map(all.map(r => [r.id, r]));
        return Array.from(uniqueMap.values());
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [transformNodes]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchRestaurants(debouncedSearchTerm, 8, null);
    } else {
      setRestaurants([]);
    }
  }, [debouncedSearchTerm, fetchRestaurants]);

  const fetchReviewDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      if (!firebaseUser) {
        setLoadingDrafts(false);
        return;
      }
      
      // Get Firebase ID token for authentication
      const idToken = await firebaseUser.getIdToken();
      
      // Fetch draft reviews from new Hasura API
      const response = await reviewV2Service.getDraftReviews(idToken, {
        limit: 100,
        offset: 0
      });
      
      // Transform ReviewV2 to DraftReviewData format
      const transformedDrafts = transformReviewDrafts(response.reviews);
      
      // Create mapping from numeric ID to UUID for deletion
      const idMap = new Map<number, string>();
      response.reviews.forEach((review: ReviewV2) => {
        const numericId = parseInt(review.id.replace(/-/g, '').substring(0, 8), 16) % 2147483647;
        idMap.set(numericId, review.id);
      });
      setDraftIdToUuidMap(idMap);
      
      setAllDrafts(transformedDrafts);
      setReviewDrafts(transformedDrafts.slice(0, 4));
    } catch (error) {
      console.error("Error fetching review drafts:", error);
      // Set empty arrays on error to prevent UI issues
      setAllDrafts([]);
      setReviewDrafts([]);
    } finally {
      setLoadingDrafts(false);
    }
  }, [firebaseUser, transformReviewDrafts]);

  useEffect(() => {
    if (!debouncedSearchTerm) {
      fetchReviewDrafts();
    }
  }, [firebaseUser, debouncedSearchTerm, fetchReviewDrafts]);

  const confirmDeleteDraft = async (draftId: number) => {
    if (!firebaseUser) return false;
    
    // Get UUID from mapping
    const reviewUuid = draftIdToUuidMap.get(draftId);
    if (!reviewUuid) {
      console.error("Could not find UUID for draft ID:", draftId);
      toast.error("Failed to delete draft: UUID not found");
      return false;
    }
    
    try {
      // Use new Hasura API to delete review
      await reviewV2Service.deleteReview(reviewUuid);
      
      // Update state
      setReviewDrafts(prev => prev.filter(draft => draft.id !== draftId));
      const updatedAllDrafts = allDrafts.filter(d => d.id !== draftId);
      setAllDrafts(updatedAllDrafts);
      setReviewDrafts(updatedAllDrafts.slice(0, 4));
      
      // Remove from UUID map
      const updatedMap = new Map(draftIdToUuidMap);
      updatedMap.delete(draftId);
      setDraftIdToUuidMap(updatedMap);
      
      setDraftToDelete(null);
      toast.success(deleteDraftSuccess);
      return true;
    } catch (error) {
      console.error("Error deleting draft", error);
      toast.error(deleteDraftError);
      return false;
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchTerm(listing);
  }

  const removeListing = (item: DraftReviewData) => {
    setDraftToDelete(item);
    setIsShowDelete(true);
  }

  const fetchRecentlyVisited = useCallback(async () => {
    if (!firebaseUser) return;

    setLoadingVisited(true);
    try {
      // Get Firebase ID token for authentication
      const idToken = await firebaseUser.getIdToken();
      const visitedIds = await restaurantService.fetchRecentlyVisitedRestaurants(idToken);
      const restaurantPromises = (visitedIds as unknown as (string | number)[]).map((id: string | number) =>
        restaurantService.fetchRestaurantById(String(id))
      );
      const restaurants = await Promise.all(restaurantPromises);
      const transformed = transformNodes(restaurants);
      setRecentlyVisitedRestaurants(transformed);
    } catch (error) {
      console.error("Failed to fetch recently visited restaurants:", error);
    } finally {
      setLoadingVisited(false);
    }
  }, [firebaseUser, transformNodes]);

  useEffect(() => {
    if (firebaseUser && !debouncedSearchTerm) {
      fetchRecentlyVisited();
    }
  }, [firebaseUser, debouncedSearchTerm, fetchRecentlyVisited]);


  return (
    <>
      <div className="max-w-7xl mx-auto mt-20">
        <div className="py-6 md:py-8 flex flex-col justify-center items-center">
          <h1 className="text-lg md:text-2xl text-[#31343F] text text-center font-neusans">Find a listing to review</h1>
          <form onSubmit={handleSearch} className="my-6 md:my-10 max-w-[525px] w-full px-6 lg:px-0">
            <div className="flex gap-2.5 items-center border border-[#E5E5E5] px-4 py-2 rounded-[50px] drop-shadow-[0_0_10px_#E5E5E5]">
              <div className="flex items-center flex-1 gap-2">
                <FiSearch className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by Listing Name"
                  className="font-neusans flex-1 border-none outline-none bg-transparent text-sm md:text-base text-[#31343F] placeholder-gray-400"
                  value={listing}
                  onChange={(e) => setListing(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="font-neusans rounded-full text-sm md:text-base text-[#FCFCFC] h-9 md:h-11 w-fit px-4 md:px-6 py-2 md:py-3 text-center bg-[#E36B00] md:leading-none flex-shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {debouncedSearchTerm && (restaurants.length > 0 || loading) && (
            <div className="w-full text-center mb-6">
              <h2 className="text-lg md:text-xl text-[#31343F] font-neusans">
                {loading ? `Searching for "${debouncedSearchTerm}"` : `${restaurants.length} results for "${debouncedSearchTerm}"`}
              </h2>
            </div>
          )}

          {/* Conditional rendering of "My Review Drafts" */}
          {!debouncedSearchTerm && (
            <div className="restaurants__container md:!px-4 xl:!px-0 mt-6 md:mt-10 w-full">
              <div className="restaurants__content">
                <h1 className="text-lg md:text-2xl text-[#31343F] text-center text font-neusans">My Review Drafts</h1>
                {reviewDrafts.length === 0 && !loadingDrafts && (
                  <p className="w-full text-center flex justify-center items-center py-8 text-gray-400 text-sm">
                    You don't have any review drafts.
                  </p>
                )}
                <div className="restaurants__grid mt-6 md:mt-8">
                  {reviewDrafts.map((revDraft) => (
                    <DraftReviewCard
                      key={revDraft.id}
                      reviewDraft={revDraft}
                      onDelete={() => removeListing(revDraft)}
                    />
                  ))}
                  {loadingDrafts && [...Array(4)].map((_, i) => <SkeletonListingCard key={i} />)}
                </div>
              </div>
            </div>
          )}

          {/* Conditional rendering of "Recently Visited" */}
          {!debouncedSearchTerm && (
            <div className="restaurants__container md:!px-4 xl:!px-0 mt-6 md:mt-10 w-full">
              <div className="restaurants__content mt-6 md:mt-10">
                <h1 className="text-lg md:text-2xl text-[#31343F] text-center text font-medium">Recently Visited</h1>
                {recentlyVisitedRestaurants.length === 0 && !loadingVisited && (
                  <p className="w-full text-center flex justify-center items-center py-8 text-gray-400 text-sm">
                    You haven’t visited any restaurants yet.
                  </p>
                )}
                <div className="restaurants__grid mt-6 md:mt-8">
                  {recentlyVisitedRestaurants.map((rest) => (
                    <RestaurantCard key={rest.id} restaurant={rest} />
                  ))}
                  {loadingVisited && [...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              </div>
            </div>
          )}

          {/* Display Restaurants section only when there's an active search or it's loading search results */}
          {debouncedSearchTerm && (
            <div className="restaurants__container md:!px-4 xl:!px-0 mt-6 md:mt-10 w-full">
              <div className="restaurants__content mt-6 md:mt-10">
                <h1 className="text-lg md:text-2xl text-[#31343F] text-center text font-medium">
                  Search Results
                </h1>
                <div className="flex justify-center text-center mt-6 min-h-[40px]">
                  {!loading && restaurants.length === 0 && (
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-m">
                        No listings found for "{debouncedSearchTerm}". Try a different search!
                      </p>
                      <Link
                        href={LISTING_EXPLANATION}
                        type="submit"
                        className="rounded-full    text-sm md:text-base text-black h-9 md:h-11 font-semibold w-fit px-4 md:px-6 py-2 md:py-3 text-center"
                      >
                        Add Listing
                      </Link>
                    </div>
                  )}
                </div>
                <div className="restaurants__grid mt-6 md:mt-8">
                  {!loading && restaurants.map((rest) => (
                    <RestaurantCard key={rest.id} restaurant={rest} />
                  ))}
                  {loading && [...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ReviewModal
        header="Delete this Draft?"
        content="Your draft will be removed."
        isOpen={isShowDelete}
        setIsOpen={(open: boolean) => {
          if (!isLoadingDelete) setIsShowDelete(open);
        }}
        onConfirm={async () => {
          if (!draftToDelete) return;
          setIsLoadingDelete(true);
          const success = await confirmDeleteDraft(draftToDelete.id);
          if (success) {
            setIsShowDelete(false);
          }
          setIsLoadingDelete(false);
        }}
        loading={isLoadingDelete} // pass loading flag to modal
      />
    </>
  );
};

export default ListingPage;
