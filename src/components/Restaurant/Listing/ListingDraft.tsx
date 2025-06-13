'use client'
import { Restaurant } from "@/data/dummyRestaurants" // You'll likely replace this with actual fetched data types
import Link from "next/link"
import { useState, useEffect, use } from "react"
import CustomModal from "@/components/ui/Modal/Modal"
import "@/styles/pages/_restaurants.scss"
import { RestaurantService } from "@/services/restaurant/restaurantService"
import ListingCardDraft from "./ListingCardDraft"
import { useSession } from "next-auth/react"
import { user } from "@heroui/theme"
// import RestaurantService from "@/services/RestaurantService" // Ensure this path is correct

// You might want to define an interface for your fetched restaurant data
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
    // Add any other fields you expect, like status if your frontend needs to display it
}

const ListingDraftPage = () => {
    const [isShowDelete, setIsShowDelete] = useState<boolean>(false)
    const [pendingListings, setPendingListings] = useState<FetchedRestaurant[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const { data: session, status } = useSession();
    const userId = session?.user?.id || null;

useEffect(() => {
  const getPendingListings = async () => {
    if (status !== 'authenticated' || !userId) return; // Wait until session is ready

    try {
      setLoading(true);
      const data = await RestaurantService.fetchAllRestaurants("", 10, null, "", [], "", "PENDING", userId)
      console.log("Fetched pending listings:", data);
      setPendingListings(data.nodes);
    } catch (err) {
      console.error("Failed to fetch pending listings:", err);
      setError("Failed to load pending listings. Please ensure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  getPendingListings();
}, [status, userId]);


    const removeListing = (item: FetchedRestaurant, index: number) => {
        setIsShowDelete(true)
        console.log(item, 'item to remove')
        // For actual deletion, you would call an API here that also sends the token.
        // This part would involve another GraphQL mutation or REST API call.
    }

    return (
        <div className="mt-20 mb-10 pt-10 lg:px-16">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-medium text-black">My Listing Draft</h1>
                <Link href="/listing/explanation" className="px-6 py-3 text-center text-[#FCFCFC] cursor-pointer bg-[#E36B00] font-semibold rounded-[50px]">Add New Listing</Link>
            </div>
            <div className="restaurants__grid mt-8">
                {loading && <p>Loading draft listings...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && pendingListings.length === 0 && !error && <p>No pending draft listings found.</p>}
                {!loading && pendingListings.length > 0 && (
                    // Assuming you have a ListingCard component that accepts `restaurant` prop
                    // and handles deletion. Replace the placeholder div with your ListingCard.
                    pendingListings.map((restaurant: FetchedRestaurant, index: number) => (
                        <ListingCardDraft key={restaurant.id} restaurant={restaurant} onDelete={() => removeListing(restaurant, index)} />
                    ))
                )}
            </div>
            <CustomModal
                header="Delete this Draft?"
                content="Your draft will be removed."
                isOpen={isShowDelete}
                setIsOpen={() => setIsShowDelete(!isShowDelete)}
            />
        </div>
    )
}

export default ListingDraftPage