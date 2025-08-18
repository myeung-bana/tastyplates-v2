export interface Review {
  id: string;
  authorId: string;
  restaurantId: string;
  rating: number;
  date: string;
  comment: string;
  images: string[];
  userImage: string;
}

export interface ReviewList {
  reviews: Review[];
}

export const reviewlist: ReviewList[] = [
  {
    reviews: [
      {
        id: "550e8400-e39b-41d4-a716-446655440000",
        authorId: "123e4567-e89b-12d3-a456-426614174000",
        restaurantId: "550e8400-e29b-41d4-a716-446655440000", // Burger House
        rating: 5,
        date: "March 15, 2024",
        comment:
          "The burgers here are absolutely amazing! The meat is always perfectly cooked and juicy.",
        images: ["/images/Photos-Review1.png", "/images/food-review-001.jpg", "/images/Photos-Review1.png", "/images/food-review-001.jpg", "/images/Photos-Review1.png", "/images/food-review-001.jpg"],
        userImage: "/profile-icon.svg",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        authorId: "987fcdeb-51a2-43d7-9b56-312c9d4f6789",
        restaurantId: "550e8400-e29b-41d4-a716-446655440001", // Sushi Master
        rating: 4,
        date: "March 10, 2024",
        comment:
          "The sushi is incredibly fresh and the presentation is beautiful! Love their dragon rolls.",
        images: ["/images/Photos-Review-4.png", "/images/food-review-001.jpg"],
        userImage: "/profile-icon.svg",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        authorId: "550e8403-e29b-41d4-a716-446655440000",
        restaurantId: "550e8400-e29b-41d4-a716-446655440002", // Pizza Palace
        rating: 5,
        date: "March 8, 2024",
        comment:
          "Best pizza in town! The crust is perfectly crispy and the toppings are generous.",
        images: ["/images/Photos-Review-8.png", "/images/food-review-001.jpg"],
        userImage: "/profile-icon.svg",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        authorId: "987fcdeb-51a2-43d7-9b56-312c9d4f6789",
        restaurantId: "550e8400-e29b-41d4-a716-446655440003", // Another Pizza Palace
        rating: 4,
        date: "March 5, 2024",
        comment:
          "Great variety of dishes and excellent service. Will definitely come back!",
        images: ["/images/default-image.png", "/images/food-review-001.jpg"],
        userImage: "/profile-icon.svg",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        authorId: "111e4567-e89b-12d3-a456-426614174001",
        restaurantId: "550e8400-e29b-41d4-a716-446655440000", // Burger House
        rating: 5,
        date: "March 20, 2024",
        comment: "Absolutely loved the burgers! Will be back for sure.",
        images: ["/images/Photos-Review.png", "/images/Photos-Review.png"],
        userImage: "/profile-icon.svg",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        authorId: "222e4567-e89b-12d3-a456-426614174002",
        restaurantId: "550e8400-e29b-41d4-a716-446655440000", // Burger House
        rating: 4,
        date: "March 21, 2024",
        comment: "Great atmosphere and delicious burgers!",
        images: ["/images/Photos-Review-5.png", "/images/Photos-Review-5.png"],
        userImage: "/profile-icon.svg",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004f",
        authorId: "111e4567-e89b-12d3-a456-426614174001",
        restaurantId: "550e8400-e29b-41d4-a716-446655440000", // Burger House
        rating: 5,
        date: "March 20, 2024",
        comment: "Absolutely loved the burgers! Will be back for sure.",
        images: ["/images/Photos-Review-9.png", "/images/Photos-Review.png"],
        userImage: "/profile-icon.svg",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005f",
        authorId: "222e4567-e89b-12d3-a456-426614174002",
        restaurantId: "550e8400-e29b-41d4-a716-446655440000", // Burger House
        rating: 4,
        date: "March 21, 2024",
        comment: "Great atmosphere and delicious burgers!",
        images: ["/images/Photos-Review-14.png", "/images/Photos-Review-5.png"],
        userImage: "/profile-icon.svg",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004g",
        authorId: "111e4567-e89b-12d3-a456-426614174001",
        restaurantId: "550e8400-e29b-41d4-a716-446655440000", // Burger House
        rating: 5,
        date: "March 20, 2024",
        comment: "Absolutely loved the burgers! Will be back for sure.",
        images: ["/images/food-review-001.jpg", "/images/food-review-001.jpg"],
        userImage: "/profile-icon.svg",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005g",
        authorId: "222e4567-e89b-12d3-a456-426614174002",
        restaurantId: "550e8400-e29b-41d4-a716-446655440000", // Burger House
        rating: 4,
        date: "March 21, 2024",
        comment: "Great atmosphere and delicious burgers!",
        images: ["/images/food-review-001.jpg", "/images/food-review-001.jpg"],
        userImage: "/profile-icon.svg",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004h",
        authorId: "111e4567-e89b-12d3-a456-426614174001",
        restaurantId: "550e8400-e29b-41d4-a716-446655440000", // Burger House
        rating: 5,
        date: "March 20, 2024",
        comment: "Absolutely loved the burgers! Will be back for sure.",
        images: ["/images/food-review-001.jpg", "/images/food-review-001.jpg"],
        userImage: "/profile-icon.svg",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005d",
        authorId: "222e4567-e89b-12d3-a456-426614174002",
        restaurantId: "550e8400-e29b-41d4-a716-446655440000", // Burger House
        rating: 4,
        date: "March 21, 2024",
        comment: "Great atmosphere and delicious burgers!",
        images: ["/images/food-review-001.jpg", "/images/food-review-001.jpg"],
        userImage: "/profile-icon.svg",
      },
    ],
  },
];

// Helper function to get reviews for a specific restaurant
export const getRestaurantReviews = (restaurantId: string): Review[] => {
  return reviewlist[0].reviews.filter(
    (review) => review.restaurantId === restaurantId
  );
};
