import { Review, reviewlist } from "@/data/dummyReviews";

export const getRestaurantReviews = (restaurantId: string): Review[] => {
  return reviewlist[0].reviews.filter(
    (review) => review.restaurantId === restaurantId
  );
};

export const getRestaurantReviewsCount = (restaurantId: string): number => {
  return reviewlist[0].reviews.filter(
    (review) => review.restaurantId === restaurantId
  ).length;
};

export const getAllReviews = (): Review[] => {
  return reviewlist[0].reviews;
};
