// ListingDraft.tsx
'use client'
import { Restaurant } from "@/data/dummyRestaurants" // This import might be unused or for dummy data
import Link from "next/link"
import { useState, useEffect, Suspense } from "react" // Ensure Suspense is imported
import CustomModal from "@/components/ui/Modal/Modal" // This CustomModal seems unrelated to ReviewModal for deletion
import "@/styles/pages/_restaurants.scss"
import { RestaurantService } from "@/services/restaurant/restaurantService"
import ListingCardDraft from "./ListingCardDraft"
import { useSession } from "next-auth/react"

interface FetchedRestaurant {
    id: string;
    databaseId: number;
    title: string;
    slug: string;
    content: string;
    listingStreet: string;
    palates: { nodes: { name: string }[] };
    featuredImage: { node: { sourceUrl: string } };
    listingCategories: { nodes: { id: string; name: string }[] };
    countries: { nodes: { name: string }[] };
}

const ListingDraftPage = () => {
    // isShowDelete and removeListing here are for CustomModal, not the delete confirmation for ListingCardDraft
    // You might want to remove `isShowDelete` and `removeListing` if CustomModal is not used for this specific delete flow.
    // For the delete confirmation modal, ListingCardDraft handles its own modal internally now.
    // So, we only need state for the actual listings.

    const [pendingListings, setPendingListings] = useState<FetchedRestaurant[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { data: session, status } = useSession();
    const userId = session?.user?.id || null;

    // Function to fetch pending listings
    const getPendingListings = async () => {
        if (status !== 'authenticated' || !userId) {
            setLoading(false); // Stop loading if not authenticated
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

    // This function will be passed to ListingCardDraft's onDeleteSuccess prop.
    // It should remove the deleted listing from the state without redirecting.
    const handleListingDeleted = (deletedRestaurantId: string) => {
        setPendingListings(prevListings =>
            prevListings.filter(listing => listing.id !== deletedRestaurantId)
        );
        // No redirection needed here
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
                        {pendingListings.map((restaurant: FetchedRestaurant) => ( // Removed index as it's not needed for key
                            <ListingCardDraft
                                key={restaurant.id}
                                restaurant={restaurant}
                                // Pass the ID of the deleted restaurant back to the parent
                                onDeleteSuccess={() => handleListingDeleted(restaurant.id)}
                            />
                        ))}
                    </Suspense>
                )}
            </div>
            {/* If CustomModal is not used for this delete flow, you can remove it */}
            {/* <CustomModal
                header="Delete this Draft?"
                content="Your draft will be removed."
                isOpen={isShowDelete}
                setIsOpen={() => setIsShowDelete(!isShowDelete)}
            /> */}
        </div>
    )
}

export default ListingDraftPage