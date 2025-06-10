import AddListingPage from "@/components/Restaurant/Listing/AddListing";
import { Suspense } from "react";

const AddReviewPage = () => {
  return (
    <section>
      <Suspense fallback={<div></div>}>
        <AddListingPage step={2} />
      </Suspense>
    </section>
  );
};

export default AddReviewPage;
