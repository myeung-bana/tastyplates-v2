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
import { FaPen, FaRegHeart, FaHeart, FaMapMarkerAlt } from "react-icons/fa";
import RestaurantReviews from "@/components/RestaurantReviews";
import RestaurantDetailSkeleton from "@/components/RestaurantDetailSkeleton";
import RestaurantMap from "@/components/Restaurant/Details/RestaurantMap";
import { Dialog } from "@headlessui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SignupModal from "@/components/SignupModal";
import SigninModal from "@/components/SigninModal";
import CheckInRestaurantButton from "@/components/CheckInRestaurantButton";

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
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);

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
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch favorite status");
        return res.json();
      })
      .then(data => {
        if (isMounted) setSaved(data.status === "saved");
      })
      // No error state for initial check, just let it update when ready
      .finally(() => {
        if (isMounted) setInitialized(true);
      });
    return () => { isMounted = false; };
  }, [restaurantSlug, session]);

  const handleToggle = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    const prevSaved = saved;
    setSaved(prev => !prev);
    window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurantSlug, status: !saved } }));
    const action = saved ? "unsave" : "save";
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WP_API_URL}/wp-json/restaurant/v1/favorite/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session.accessToken && { Authorization: `Bearer ${session.accessToken}` }),
        },
        body: JSON.stringify({ restaurant_slug: restaurantSlug, action }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update favorite status");
      const data = await res.json();
      setSaved(data.status === "saved");
      window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurantSlug, status: data.status === "saved" } }));
    } catch (err) {
      setSaved(prevSaved);
      window.dispatchEvent(new CustomEvent("restaurant-favorite-changed", { detail: { slug: restaurantSlug, status: prevSaved } }));
      setError("Could not update favorite status");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <>
        <button
          className="restaurant-detail__review-button flex items-center gap-2"
          onClick={() => setShowSignup(true)}
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
          palates: data.palates?.nodes || [],
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
          overAllRating: data.averageRating,
          overAllReviewCount: data.ratingsCount,
          recognitionCounts: data.recognitionCounts,
          palateStats: data.palateStats,
        };
        setRestaurant(transformed);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching restaurant:", err);
        setLoading(false);
      });
  }, [slug]);
  // console.log('average palate', restaurant.palateStats?.[restaurant.palates[1].name]?.count)


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
  };

  const addReview = () => {
    router.push(`/add-review/${restaurant.slug}/${restaurant.databaseId}`);
  }

  return (
    <div className="restaurant-detail mt-32 md:mt-10">
      <div className="restaurant-detail__container !max-w-[82rem]">
        <div className="restaurant-detail__header">
          <div className="restaurant-detail__info">
            <div className="flex flex-col-reverse md:flex-col">
              <div className="flex flex-col md:flex-row justify-between px-4 md:px-0">
                <div className="mt-6 md:mt-0">
                  <h1 className="restaurant-detail__name">{restaurant.name}</h1>
                  <div className="restaurant-detail__meta">
                    <div className="restaurant-detail__cuisine">
                      {restaurant.palates.map((palate: { name: string }, index: number) => (
                        <div className="flex items-center gap-2" key={`palate-${index}`}>
                          {index > 0 && <span>&#8226;</span>}
                          <span className="cuisine-tag">{palate.name}</span>
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
                    {restaurant?.palates?.[0] && (
                      <>
                      <div className="rating-column">
                        <h3>{restaurant.palates[0]?.name} Palate</h3>
                        <div className="rating-value">
                          {/* <FiStar className="fill-yellow-500" /> */}
                          <span className="text-[#E36B00] text-lg md:text-2xl font-medium">
                            {restaurant.palateStats?.[0]?.count > 0
                              ? (Number(restaurant.palateStats[0].avg) % 1 === 0
                                ? restaurant.palateStats[0].avg.toFixed(0)
                                : restaurant.palateStats[0].avg.toFixed(2))
                              : "0"}
                          </span>
                        </div>
                        <span className="review-count">
                          {restaurant.palateStats?.[0]?.count > 0
                            ? `${restaurant.palateStats[0].count} reviews`
                            : "No matching palate reviews"}
                        </span>
                      </div>
                      <div className="h-[85%] border-l border-[#CACACA]"></div>
                      </>
                    )}
                    <div className="rating-column">
                      <h3>Overall Rating</h3>
                      <div className="rating-value">
                        {/* <FiStar className="fill-yellow-500" /> */}
                        <span className="text-[#E36B00] text-lg md:text-2xl font-medium">
                          {restaurant.overAllReviewCount > 0
                            ? (Number(restaurant.overAllRating) % 1 === 0
                              ? Number(restaurant.overAllRating).toFixed(0)
                              : restaurant.overAllRating.toFixed(2))
                            : "0"}
                        </span>
                      </div>
                      <span className="review-count">
                        {restaurant.overAllReviewCount > 0
                          ? `${restaurant.overAllReviewCount} reviews`
                          : "No reviews yet"}
                      </span>
                    </div>
                    {restaurant?.palates?.[1] && (
                      <>
                        <div className="h-[85%] border-l border-[#CACACA]"></div>
                        <div className="rating-column">
                          <h3>{restaurant.palates[1].name} Palate</h3>
                          <div className="rating-value">
                            <span className="text-[#E36B00] text-lg md:text-2xl font-medium">
                              {restaurant.palateStats?.[1]?.count > 0
                                ? (Number(restaurant.palateStats[1].avg) % 1 === 0
                                  ? restaurant.palateStats[1].avg.toFixed(0)
                                  : restaurant.palateStats[1].avg.toFixed(2))
                                : "0"}
                            </span>
                          </div>
                          <span className="review-count">
                            {restaurant.palateStats?.[1]?.count > 0
                              ? `${restaurant.palateStats[1].count} reviews`
                              : "No matching palate reviews"}
                          </span>
                        </div>
                      </>
                    )}
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
                            {restaurant.recognitionCounts?.mustRevisit || 0}
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
                            {restaurant.recognitionCounts?.instaWorthy || 0}
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
                            {restaurant.recognitionCounts?.valueForMoney || 0}
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
                            {restaurant.recognitionCounts?.bestService || 0}
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
              <RestaurantReviews restaurantId={restaurant.databaseId} />
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
