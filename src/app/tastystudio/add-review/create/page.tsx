import { Suspense } from "react";
import ReviewSubmissionCreatePage from "@/components/Restaurant/Review/ReviewSubmissionCreate";
import ReviewSubmissionSkeleton from "@/components/ui/Skeleton/ReviewSubmissionSkeleton";

const AddReviewCreatePage = () => {
  return (
    <section>
      <Suspense fallback={<ReviewSubmissionSkeleton />}>
        <ReviewSubmissionCreatePage />
      </Suspense>
    </section>
  );
};

export default AddReviewCreatePage;

