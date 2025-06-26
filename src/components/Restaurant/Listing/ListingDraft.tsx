// ListingDraft.tsx
'use client'
import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import "@/styles/pages/_restaurants.scss"
import { RestaurantService } from "@/services/restaurant/restaurantService"
import ListingCardDraft from "./ListingCardDraft"
import { useSession } from "next-auth/react"

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

const ListingDraftPage = () => {

    const [pendingListings, setPendingListings] = useState<FetchedRestaurant[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { data: session, status } = useSession();
    const userId = session?.user?.id || null;
    const getPendingListings = async () => {

        if (status !== 'authenticated' || !userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await RestaurantService.fetchAllRestaurants("", 10, null, "", [], "", "PENDING", userId);
            console.log("Fetched pending listings:", data);
            setPendingListings(data.nodes);
        } catch (err) {
            console.error("Failed to fetch pending listings:", err);
            setError("Failed to load pending listings. Please ensure you are logged in.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getPendingListings();
    }, [status, userId]);

    const handleListingDeleted = (deletedRestaurantId: string) => {
        setPendingListings(prevListings =>
            prevListings.filter(listing => listing.id !== deletedRestaurantId)
        );
    };

    return (
        <div className="mt-20 mb-10 pt-10 px-3 md:px-6 xl:px-16">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-medium text-black">My Listing Draft</h1>
                <Link href="/listing/explanation" className="px-6 py-3 text-center text-[#FCFCFC] cursor-pointer bg-[#E36B00] font-semibold rounded-[50px]">Add New Listing</Link>
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