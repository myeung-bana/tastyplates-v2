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
import { ReviewService } from "@/services/Reviews/reviewService";
import { useSession } from "next-auth/react";
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
const reviewService = new ReviewService();

const ListingPage = () => {
  const { data: session } = useSession();
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

  const transformReviewDrafts = useCallback((nodes: Record<string, unknown>[]): DraftReviewData[] => {
    return nodes.map((item: Record<string, unknown>) => {
      // Debug logging for images
      console.log('=== Draft Review Transformation Debug ===');
      console.log('Item ID:', item.id);
      console.log('Raw item.review_images:', item.review_images);
      console.log('Type of review_images:', typeof item.review_images);
      console.log('Is array?', Array.isArray(item.review_images));
      
      if (Array.isArray(item.review_images)) {
        console.log('review_images array length:', item.review_images.length);
        item.review_images.forEach((img, idx) => {
          console.log(`  Image ${idx}:`, img);
          console.log(`    Type:`, typeof img);
          console.log(`    Has sourceUrl:`, !!(img as Record<string, unknown>)?.sourceUrl);
          console.log(`    Has id:`, !!(img as Record<string, unknown>)?.id);
        });
      }
      
      // Simplified transformation: Backend already returns {id, sourceUrl} - use directly like EditReviewSubmission does
      const finalImages = ((item.review_images as Record<string, unknown>[]) || [])
        .map((img: Record<string, unknown>) => {
          console.log('Processing image:', img);
          // Backend already returns {id, sourceUrl} - use directly
          if (img && typeof img === 'object' && img.sourceUrl) {
            const imageId = typeof img.id === 'number' 
              ? img.id 
              : (typeof img.id === 'string' ? parseInt(img.id, 10) : 0);
            
            console.log('  → Valid image with sourceUrl:', img.sourceUrl);
            return {
              databaseId: imageId || 0,
              id: String(img.id || imageId || ''),
              sourceUrl: img.sourceUrl as string,
            };
          }
          console.log('  → Skipping invalid image');
          return null;
        })
        .filter((img): img is { databaseId: number; id: string; sourceUrl: string } => 
          img !== null && 
          typeof img.sourceUrl === 'string' && 
          img.sourceUrl.trim().length > 0
        );
      
      console.log('Final reviewImages array:', finalImages);
      console.log('=== End Debug ===');
      
      return {
        id: item.id as number,
        post: item.post as number,
        author: item.author as number,
        authorName: item.author_name as string,
        authorAvatar: (item.author_avatar as string) || undefined,
        content: {
          rendered: (item.content as Record<string, unknown>)?.rendered as string || "",
          raw: (item.content as Record<string, unknown>)?.raw as string || ""
        },
        date: item.date as string,
        link: item.link as string,
        status: item.status as string,
        type: item.type as string,
        recognitions: (item.recognitions as string[]) || ((item.meta as Record<string, unknown>)?.recognitions as string[]) || [],
        reviewImages: finalImages,
        reviewMainTitle: item.review_main_title as string,
        reviewStars: item.review_stars as string,
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
      if (!session?.accessToken) return;
      const data = await reviewService.fetchReviewDrafts(session.accessToken);
      const transformedDrafts = transformReviewDrafts(data);
      setAllDrafts(transformedDrafts)
      setReviewDrafts(transformedDrafts.slice(0, 4));
    } catch (error) {
      console.error("Error fetching review drafts:", error);
    } finally {
      setLoadingDrafts(false);
    }
  }, [session?.accessToken, transformReviewDrafts]);

  useEffect(() => {
    if (!debouncedSearchTerm) {
      fetchReviewDrafts();
    }
  }, [session?.accessToken, debouncedSearchTerm, fetchReviewDrafts]);

  const confirmDeleteDraft = async (draftId: number) => {
    if (!session?.accessToken) return;
    try {
      await reviewService.deleteReviewDraft(draftId, session.accessToken, true);
      setReviewDrafts(prev => prev.filter(draft => draft.id !== draftId));
      const updatedAllDrafts = allDrafts.filter(d => d.id !== draftId);
      setAllDrafts(updatedAllDrafts);
      setReviewDrafts(updatedAllDrafts.slice(0, 4));
      setDraftToDelete(null);
      toast.success(deleteDraftSuccess)
      return true;
    } catch (error) {
      console.error("Error deleting draft", error);
      toast.error(deleteDraftError)
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
    if (!session?.accessToken) return;

    setLoadingVisited(true);
    try {
      const visitedIds = await restaurantService.fetchRecentlyVisitedRestaurants(session.accessToken);
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
  }, [session?.accessToken, transformNodes]);

  useEffect(() => {
    if (session?.accessToken && !debouncedSearchTerm) {
      fetchRecentlyVisited();
    }
  }, [session?.accessToken, debouncedSearchTerm, fetchRecentlyVisited]);


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
