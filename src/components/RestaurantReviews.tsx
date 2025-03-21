import "@/styles/pages/_restaurant-details.scss";
import ReviewBlock from "./ReviewBlock"; // Import the ReviewBlock component
import { users } from "@/data/dummyUsers"; // Import users data

interface Review {
  id: string;
  authorId: string;
  restaurantId: string;
  user: string;
  rating: number;
  date: string;
  comment: string;
  images: string[];
  userImage: string;
}

interface ReviewList {
  reviews: Array<Review>;
}

export default function RestaurantReviews({
  reviewlist,
}: {
  reviewlist: ReviewList[];
}) {
  return (
    <section className="restaurant-reviews">
      <h2>Customer Reviews</h2>
      <div className="reviews-container">
        {reviewlist[0]?.reviews.map((review) => {
          // Find the author based on authorId
          const author = users.find((user) => user.id === review.authorId);
          const authorData = author || {
            name: "Unknown User",
            image: "/images/default_user.png",
            palate: [],
          };

          return <ReviewBlock key={review?.id} review={review} />;
        })}
      </div>
    </section>
  );
}
