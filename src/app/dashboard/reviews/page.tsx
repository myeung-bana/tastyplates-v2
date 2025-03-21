// tastyplates-frontend/src/app/dashboard/lists/page.tsx
"use client";
import { useParams } from "next/navigation";
import { reviewlist } from "@/data/dummyReviews";
import ReviewBlock from "@/components/ReviewBlock";
import "@/styles/pages/_lists.scss";

const CURRENT_USER_ID = "123e4567-e89b-12d3-a456-426614174000";

const ReviewsPage = () => {
  const params = useParams();
  const userReviews = reviewlist[0].reviews
    .filter((review) => review.authorId === CURRENT_USER_ID)
    .map((review) => ({
      ...review,
      user: review.authorId, // or however you want to map the user field
    }));

  return (
    <div className="dashboard-content">
      <div className="lists-header">
        <h1 className="dashboard-overview__title">Reviews</h1>
      </div>
      <div className="reviews-container">
        {userReviews.map((review) => (
          <ReviewBlock key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};

export default ReviewsPage;
