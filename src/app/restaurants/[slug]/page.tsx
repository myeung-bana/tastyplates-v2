"use client";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { FiMapPin, FiPhone } from "react-icons/fi";
import { useEffect, useState } from "react";
import { getRestaurantReviews } from "@/utils/reviewUtils";
import { RestaurantService } from "@/services/restaurant/restaurantService";
import "@/styles/pages/_restaurant-details.scss";
import { users } from "@/data/dummyUsers";
import { palates } from "@/data/dummyPalate";
import { Review } from "@/data/dummyReviews";
import ReviewModal from "@/components/ReviewModal";
import { FaPen, FaRegHeart, FaHeart } from "react-icons/fa";
import RestaurantReviews from "@/components/RestaurantReviews";
import RestaurantDetailSkeleton from "@/components/RestaurantDetailSkeleton";
import RestaurantMap from "@/components/Restaurant/Details/RestaurantMap";
import { Dialog } from "@headlessui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";


type tParams = { slug: string };

const calculateAverageRating = (reviews: Review[]) => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
};

const filterReviewsByPalate = (reviews: Review[], targetPalates: string[]) => {
  return reviews.filter((review) => {
    // Find the user who wrote the review
    const user = users.find((user) => user.id === review.authorId);
    if (!user) return false;

    return user.palateIds.some((palateId) => {
      const palate = palates.find((p) => p.id === palateId);
      return palate && targetPalates.includes(palate.name);
    });
  });
};

function SaveRestaurantButton({ restaurantSlug }: { restaurantSlug: string }) {
  const { data: session, status } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!session || !restaurantSlug || initialized) return;
    fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/favorite/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
      },
      body: JSON.stringify({ restaurant_slug: restaurantSlug, action: "check" }),
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted) setSaved(data.status === "saved");
      })
      .finally(() => {
        if (isMounted) setInitialized(true);
      });
    return () => { isMounted = false; };
  }, [restaurantSlug, session]);

  const handleToggle = async () => {
    if (!session) return;
    setLoading(true);
    setSaved(prev => !prev);
    const action = saved ? "unsave" : "save";
    const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/favorite/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
      },
      body: JSON.stringify({ restaurant_slug: restaurantSlug, action }),
      credentials: "include",
    });
    const data = await res.json();
    setSaved(data.status === "saved");
    setLoading(false);
  };

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
    </button>
  );
}

export default function RestaurantDetail() {
  const [restaurant, setRestaurant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const router = useRouter();

  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) return;
    RestaurantService.fetchRestaurantDetails(slug)
      .then((data) => {
        if (!data) return notFound();
        const transformed = {
          id: data.id,
          slug: data.slug,
          name: data.title,
          databaseId: data.databaseId,
          image: data.featuredImage?.node.sourceUrl || "/images/Photos-Review-12.png",
          cuisines: data.cuisines?.nodes || [],
          countries: data.countries?.nodes.map((l: { name: string }) => l.name).join(", ") || "location",
          priceRange: data.priceRange || "$$",
          phone: data.phone || "Not provided",
          description: data.content || "",
          listingStreet: data.listingStreet || "",
          listingCategories: data.listingCategories?.nodes?.map((c: { name: string }) => c.name) || [],
          listingDetails: {
            googleMapUrl: {
              latitude: data.listingDetails?.googleMapUrl?.latitude || "",
              longitude: data.listingDetails?.googleMapUrl?.longitude || "",
              streetAddress: data.listingDetails?.googleMapUrl?.streetAddress || "",
            },
            latitude: data.listingDetails?.latitude || "",
            longitude: data.listingDetails?.longitude || "",
            menuUrl: data.listingDetails?.menuUrl || "",
            openingHours: data.listingDetails?.openingHours || "",
            phone: data.listingDetails?.phone || "",
          },

        };
        setRestaurant(transformed);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching restaurant:", err);
        setLoading(false);
      });
  }, [slug]);

  console.log(restaurant);

  const lat = parseFloat(restaurant?.listingDetails?.googleMapUrl?.latitude);
  const lng = parseFloat(restaurant?.listingDetails?.googleMapUrl?.longitude);
  const address = restaurant?.listingDetails?.googleMapUrl?.streetAddress;

  if (loading) return <RestaurantDetailSkeleton />;
  if (!restaurant) return notFound();

  const restaurantId = restaurant.id;
  const restaurantReviews = {
    reviews: getRestaurantReviews(restaurantId).map((review) => ({
      ...review,
      id: review.id,
      content: review.comment,
      likes: 0,
      comments: [],
      user: review.authorId,
      userImage: users.find((u) => u.id === review.authorId)?.image || "",
      timestamp: review.date,
    })),
  };

  const allReviews = restaurantReviews.reviews;
  const japanesePalateReviews = filterReviewsByPalate(allReviews, ["Japanese"]);
  const italianMexicanPalateReviews = filterReviewsByPalate(allReviews, [
    "Italian",
    "Mexican",
  ]);

  const japaneseAvgRating = calculateAverageRating(japanesePalateReviews);
  const overallAvgRating = calculateAverageRating(allReviews);
  const italianMexicanAvgRating = calculateAverageRating(
    italianMexicanPalateReviews
  );

  const handleReviewSubmit = (review: {
    rating: number;
    comment: string;
    date: string;
  }) => {
    // Here you would typically send the review to your backend
    console.log("New review:", review);
  };

  const addReview = () => {
    router.push(`/add-review/${restaurant.slug}/${restaurant.databaseId}`);
  }

  return (
    <div className="restaurant-detail mt-32 md:mt-10">
      <div className="restaurant-detail__container">
        <div className="restaurant-detail__header">
          <div className="restaurant-detail__info">
            <div className="flex flex-col-reverse md:flex-col">
              <div className="flex flex-col md:flex-row justify-between px-4 md:px-0">
                <div className="mt-6 md:mt-0">
                  <h1 className="restaurant-detail__name">{restaurant.name}</h1>
                  <div className="restaurant-detail__meta">
                    <div className="restaurant-detail__cuisine">
                      {restaurant.cuisines.map((cuisine: { id: string; name: string }, index: number) => (
                        <div className="flex items-center gap-2" key={`cuisine-${cuisine.id}-${index}`}>
                          {index > 0 && <span>&#8226;</span>}
                          <span className="cuisine-tag">{cuisine.name}</span>
                        </div>
                      ))}
                    </div>
                    <span>{restaurant.listingStreet}</span>
                    &#8226;
                    <div className="restaurant-detail__price">
                      <span>{restaurant.priceRange}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row flex-nowrap gap-4">
                  {/* <a
                    href="/listing"
                    className="restaurant-detail__review-button"
                  > */}
                    <button onClick={addReview} className="flex items-center gap-2 hover:underline">
                      <FaPen className="size-4 md:size-5" />
                      <span className="underline">Write a Review</span>
                    </button>
                  {/* </a> */}
                  <SaveRestaurantButton restaurantSlug={restaurant.slug} />
                </div>
              </div>
              <div className="flex flex-row gap-6">
                <div className="md:rounded-l-3xl relative restaurant-detail__hero w-2/3">
                  <Image
                    src={restaurant.image}
                    alt={restaurant.name}
                    fill
                    className="restaurant-detail__image md:rounded-3xl w-full h-[307px]"
                    priority
                  />
                </div>
                <div className="items-center justify-center rounded-3xl text-center w-1/3 hidden md:flex">
                  <div className="restaurant-detail__details">
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
                        <FiMapPin className="w-5 h-5 text-gray-600 mt-1" />
                        <p className="text-sm text-gray-800 leading-snug">
                          {address || 'Address not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="restaurant-detail__detail-item">
                      <FiPhone />
                      <span>{restaurant.listingDetails?.phone || restaurant.phone}</span>
                    </div>
                    {restaurant.listingDetails?.openingHours && (
                      <div className="restaurant-detail__detail-item" key="opening-hours">
                        <span>🕒 {restaurant.listingDetails?.openingHours}</span>
                      </div>
                    )}
                    {restaurant.fieldMultiCheck90 && restaurant.fieldMultiCheck90.length > 0 && (
                      <div className="restaurant-detail__detail-item" key="field-multi-check">
                        <span>🏷️ {restaurant.fieldMultiCheck90.join(" | ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 mt-10 mx-4 lg:mx-0">
                <div className="flex flex-col justify-center items-center border border-[#CACACA] rounded-t-2xl lg:rounded-none lg:rounded-l-3xl pt-4 pb-2">
                  <h1 className="text-xs lg:text-base font-bold">Rating</h1>
                  <div className="rating-summary w-full">
                    <div className="rating-column">
                      <h3>Chinese Palate</h3>
                      <div className="rating-value">
                        {/* <FiStar className="fill-yellow-500" /> */}
                        <span className="text-[#E36B00] text-lg md:text-2xl font-medium">
                          {japaneseAvgRating}
                        </span>
                      </div>
                      <span className="review-count">
                        {japanesePalateReviews.length} reviews
                      </span>
                    </div>
                    <div className="h-[85%] border-l border-[#CACACA]"></div>
                    <div className="rating-column">
                      <h3>Overall Rating</h3>
                      <div className="rating-value">
                        {/* <FiStar className="fill-yellow-500" /> */}
                        <span className="text-[#E36B00] text-lg md:text-2xl font-medium">
                          {overallAvgRating}
                        </span>
                      </div>
                      <span className="review-count">
                        {allReviews.length} reviews
                      </span>
                    </div>
                    <div className="h-[85%] border-l border-[#CACACA]"></div>
                    <div className="rating-column">
                      <h3>Restaurant Palate</h3>
                      <div className="rating-value">
                        {/* <FiStar className="fill-yellow-500" /> */}
                        <span className="text-[#E36B00] text-lg md:text-2xl font-medium">
                          {italianMexicanAvgRating}
                        </span>
                      </div>
                      <span className="review-count">
                        {italianMexicanPalateReviews.length} reviews
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
                          src="/flag.svg"
                          height={40}
                          width={40}
                          className="size-6 md:size-10"
                          alt="Flag icon"
                        />
                        <div className="rating-value">
                          {/* <FiStar className="fill-yellow-500" /> */}
                          <span className="text-lg md:text-xl font-medium">
                            {japaneseAvgRating}
                          </span>
                        </div>
                        <span className="text-[10px] lg:text-sm whitespace-pre">Must Revisit</span>
                      </div>
                      {/* <div className="h-4/5 border-l border-[#CACACA]"></div> */}
                      <div className="rating-column w-full lg:border-r border-[#CACACA]">
                        <Image
                          src="/phone.svg"
                          height={40}
                          width={40}
                          className="size-6 md:size-10"
                          alt="phone icon"
                        />
                        <div className="rating-value">
                          {/* <FiStar className="fill-yellow-500" /> */}
                          <span className="text-lg md:text-xl font-medium">
                            {overallAvgRating}
                          </span>
                        </div>
                        <span className="text-[10px] lg:text-sm whitespace-pre">Insta-Worthy</span>
                      </div>
                    </div>
                    <div className="flex items-center w-full">
                      <div className="rating-column w-full border-r border-[#CACACA]">
                        <Image
                          src="/cash.svg"
                          height={40}
                          width={40}
                          className="size-6 md:size-10"
                          alt="cash icon"
                        />
                        <div className="rating-value">
                          {/* <FiStar className="fill-yellow-500" /> */}
                          <span className="text-lg md:text-xl font-medium">
                            {italianMexicanAvgRating}
                          </span>
                        </div>
                        <span className="text-[10px] lg:text-sm whitespace-pre">Value for Money</span>
                      </div>
                      {/* <div className="h-4/5 border-l border-[#CACACA]"></div> */}
                      <div className="rating-column w-full">
                        <Image
                          src="/helmet.svg"
                          height={40}
                          width={40}
                          className="size-6 md:size-10"
                          alt="helmet icon"
                        />
                        <div className="rating-value">
                          {/* <FiStar className="fill-yellow-500" /> */}
                          <span className="text-lg md:text-xl font-medium">
                            {italianMexicanAvgRating}
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
              <RestaurantReviews reviewlist={[restaurantReviews]} />
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
