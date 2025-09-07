// Listing.tsx
"use client";
import React, { FormEvent, useEffect, useState } from "react";
import RestaurantCard from "@/components/RestaurantCard";
import "@/styles/pages/_restaurants.scss";
// import { RestaurantDummy, restaurantsDummy } from "@/data/dummyRestaurants";
import { FiSearch } from "react-icons/fi";
import ListingCard from "./ListingCard";
import ReviewModal from "@/components/ui/Modal/ReviewModal";
import SkeletonCard from "@/components/SkeletonCard";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import { ReviewService } from "@/services/Reviews/reviewService";
import { useSession } from "next-auth/react";
import { ReviewDraft } from "@/components/Restaurant/Listing/ListingCard";
import SkeletonListingCard from "@/components/SkeletonListingCard";
import { deleteDraftError, deleteDraftSuccess } from "@/constants/messages";
import toast from 'react-hot-toast';
import { useDebounce } from "use-debounce"; // Import useDebounce
import Link from "next/link";
import { LISTING_EXPLANATION } from "@/constants/pages";
import { DEFAULT_IMAGE } from "@/constants/images";

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
  const [reviewDrafts, setReviewDrafts] = useState<ReviewDraft[]>([]);
  const [allDrafts, setAllDrafts] = useState<ReviewDraft[]>([]);
  const [draftToDelete, setDraftToDelete] = useState<ReviewDraft | null>(null);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [recentlyVisitedRestaurants, setRecentlyVisitedRestaurants] = useState<Restaurant[]>([]);

  // Helper: transform GraphQL node to Restaurant
  const transformNodes = (nodes: any[]): Restaurant[] => {
    return nodes.map((item: any) => ({
      id: item.id,
      databaseId: item.databaseId || 0, // Default to 0 if not present
      slug: item.slug,
      name: item.title,
      image: item.featuredImage?.node.sourceUrl || DEFAULT_IMAGE,
      rating: item.averageRating || "", // Default to 0 if not present
      cuisineNames: item.palates || [],
      countries: item.countries?.nodes.map((c: any) => c.name).join(", ") || "Default Location",
      priceRange: item.priceRange // Default price range
    }));
  };

  const transformReviewDrafts = (nodes: any[]): ReviewDraft[] => {
    return nodes.map((item: any) => ({
      id: item.id,
      post: item.post,
      author: item.author,
      authorName: item.author_name,
      content: {
        rendered: item.content?.rendered || "",
        raw: item.content?.raw || ""
      },
      date: item.date,
      link: item.link,
      status: item.status,
      type: item.type,
      recognitions: item.recognitions || item.meta?.recognitions || [],
      reviewImages: item.review_images?.map((img: any) => ({
        databaseId: parseInt(img.id),
        id: img.id.toString(),
        sourceUrl: img.sourceUrl,
      })) || [],
      reviewMainTitle: item.review_main_title,
      reviewStars: item.review_stars,
    }));
  };

  const fetchRestaurants = async (search: string, first = 8, after: string | null = null) => {
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
  };

  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchRestaurants(debouncedSearchTerm, 8, null);
    } else {
      setRestaurants([]);
    }
  }, [debouncedSearchTerm]);

  const fetchReviewDrafts = async () => {
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
  };

  useEffect(() => {
    if (!debouncedSearchTerm) {
      fetchReviewDrafts();
    }
  }, [session?.accessToken, debouncedSearchTerm]);

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

  const removeListing = (item: ReviewDraft) => {
    setDraftToDelete(item);
    setIsShowDelete(true);
  }

  const fetchRecentlyVisited = async () => {
    if (!session?.accessToken) return;

    setLoadingVisited(true);
    try {
      const visitedIds = await restaurantService.fetchRecentlyVisitedRestaurants(session.accessToken);
      const restaurantPromises = visitedIds.map((id: any) =>
        restaurantService.fetchRestaurantById(id)
      );
      const restaurants = await Promise.all(restaurantPromises);
      const transformed = transformNodes(restaurants);
      setRecentlyVisitedRestaurants(transformed);
    } catch (error) {
      console.error("Failed to fetch recently visited restaurants:", error);
    } finally {
      setLoadingVisited(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken && !debouncedSearchTerm) {
      fetchRecentlyVisited();
    }
  }, [session?.accessToken, debouncedSearchTerm]);


  return (
    <>
      <div className="font-inter max-w-7xl mx-auto mt-16">
        <div className="py-6 md:py-8 flex flex-col justify-center items-center">
          <h1 className="text-lg md:text-2xl text-[#31343F] text text-center font-medium">Find a listing to review</h1>
          <form onSubmit={handleSearch} className="my-6 md:my-10 max-w-[525px] w-full px-6 lg:px-0">
            <div className="flex gap-2.5 items-center border border-[#E5E5E5] px-4 py-2 rounded-[50px] drop-shadow-[0_0_10px_#E5E5E5]">
              <div className="hero__search-restaurant !bg-transparent">
                <FiSearch className="hero__search-icon" />
                <input
                  type="text"
                  placeholder="Search by Listing Name"
                  className="hero__search-input"
                  value={listing}
                  onChange={(e) => setListing(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="rounded-full text-sm md:text-base text-[#FCFCFC] h-9 md:h-11 font-semibold w-fit px-4 md:px-6 py-2 md:py-3 text-center bg-[#E36B00] md:leading-none"
              >
                Search
              </button>
            </div>
          </form>

          {debouncedSearchTerm && (restaurants.length > 0 || loading) && (
            <div className="w-full text-center mb-6">
              <h2 className="text-lg md:text-xl text-[#31343F] font-medium">
                {loading ? `Searching for "${debouncedSearchTerm}"` : `${restaurants.length} results for "${debouncedSearchTerm}"`}
              </h2>
            </div>
          )}

          {/* Conditional rendering of "My Review Drafts" */}
          {!debouncedSearchTerm && (
            <div className="restaurants__container md:!px-4 xl:!px-0 mt-6 md:mt-10 w-full">
              <div className="restaurants__content">
                <h1 className="text-lg md:text-2xl text-[#31343F] text-center text font-medium">My Review Drafts</h1>
                {reviewDrafts.length === 0 && !loadingDrafts && (
                  <p className="w-full text-center flex justify-center items-center py-8 text-gray-400 text-sm">
                    You don't have any review drafts.
                  </p>
                )}
                <div className="restaurants__grid mt-6 md:mt-8">
                  {reviewDrafts.map((revDraft) => (
                    <ListingCard
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
        setIsOpen={(open: any) => {
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
