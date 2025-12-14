// ListingDraft.tsx
'use client'
import Link from "next/link"
import { useState, useEffect, Suspense, useCallback } from "react"
import "@/styles/pages/_restaurants.scss"
import { RestaurantService } from "@/services/restaurant/restaurantService"
import ListingCardDraft from "./ListingCardDraft"
import { useFirebaseSession } from "@/hooks/useFirebaseSession"
import { sessionStatus } from "@/constants/response"
import { LISTING_EXPLANATION } from "@/constants/pages"

interface FetchedRestaurant {
    id: string;
    databaseId: number;
    title: string;
    slug: string;
    date: string;
    content: string;
    listingStreet: string;
    listingDetails: { googleMapUrl: { streetAddress: string } } | null;
    palates: { nodes: { name: string }[] };
    featuredImage: { node: { sourceUrl: string } };
    listingCategories: { nodes: { id: string; name: string }[] };
    countries: { nodes: { name: string }[] };
}

const restaurantService = new RestaurantService();

const ListingDraftPage = () => {

    const [pendingListings, setPendingListings] = useState<FetchedRestaurant[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { user, loading: sessionLoading } = useFirebaseSession();
    const userId = user?.id || null;
    const getPendingListings = useCallback(async () => {

        if (sessionLoading || !userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await restaurantService.fetchAllRestaurants("", 10, null, [], [], "", "PENDING", userId);
            setPendingListings(data.nodes as unknown as FetchedRestaurant[]);
        } catch (err) {
            console.error("Failed to fetch pending listings:", err);
            setError("Failed to load pending listings. Please ensure you are logged in.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        getPendingListings();
    }, [userId, getPendingListings]);

    const handleListingDeleted = (deletedRestaurantId: string) => {
        setPendingListings(prevListings =>
            prevListings.filter(listing => listing.id !== deletedRestaurantId)
        );
    };

    return (
        <div className="mt-20 mb-10 pt-10 px-3 md:px-6 xl:px-16">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-medium text-black">My Listing Draft</h1>
                <Link href={LISTING_EXPLANATION} className="px-6 py-3 text-center text-[#FCFCFC] cursor-pointer bg-[#E36B00] font-semibold rounded-[50px]">Add New Listing</Link>
            </div>
            <div className="restaurants__grid mt-8">
                {loading && <p>Loading draft listings...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && pendingListings.length === 0 && !error && <p>No pending draft listings found.</p>}
                {!loading && pendingListings.length > 0 && (
                    <Suspense fallback={<div></div>}>
                        {pendingListings.map((restaurant: FetchedRestaurant) => (
                            <ListingCardDraft
                                key={restaurant.id}
                                restaurant={restaurant}
                                onDeleteSuccess={() => handleListingDeleted(restaurant.id)}
                            />
                        ))}
                    </Suspense>
                )}
            </div>
        </div>
    )
}

export default ListingDraftPage