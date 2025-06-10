import AddListingPage from "@/components/Restaurant/Listing/AddListing";
import { Suspense } from "react";

const AddReviewPage = () => {
  return (
    <section>
      <Suspense fallback={<div></div>}>
          <AddListingPage />
        </Suspense>
    </section>
  );
};

export default AddReviewPage;
