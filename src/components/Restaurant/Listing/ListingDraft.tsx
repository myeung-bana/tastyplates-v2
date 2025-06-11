'use client'
import { Restaurant } from "@/data/dummyRestaurants" // You'll likely replace this with actual fetched data types
import Link from "next/link"
import { useState, useEffect } from "react"
import CustomModal from "@/components/ui/Modal/Modal"
import "@/styles/pages/_restaurants.scss"
import { RestaurantService } from "@/services/restaurant/restaurantService"
// import RestaurantService from "@/services/RestaurantService" // Ensure this path is correct

// You might want to define an interface for your fetched restaurant data
interface FetchedRestaurant {
    id: string;
    databaseId: string;
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

    useEffect(() => {
        const getPendingListings = async () => {
            try {
                setLoading(true)
                const data = await RestaurantService.fetchAllRestaurants("", 10, null, "", [], "", "PENDING")
                console.log("Fetched pending listings:", data)
                setPendingListings(data.nodes)
            } catch (err) {
                console.error("Failed to fetch pending listings:", err)
                setError("Failed to load pending listings. Please ensure you are logged in.")
            } finally {
                setLoading(false)
            }
        }

        getPendingListings()
    }, [])

    const removeListing = (item: Restaurant, index: number) => {
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
                        // <ListingCard key={restaurant.id} restaurant={restaurant} onDelete={() => removeListing(restaurant, index)} />
                        // Placeholder for your ListingCard component
                        <div key={restaurant.id} className="border p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold">{restaurant.title}</h3>
                            <p className="text-sm text-gray-600">Status: Pending</p>
                            {/* Add more details from FetchedRestaurant as needed */}
                            <button
                                onClick={() => removeListing(restaurant as any, index)} // Cast to any if Restaurant and FetchedRestaurant don't exactly match
                                className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
                            >
                                Delete Draft
                            </button>
                        </div>
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