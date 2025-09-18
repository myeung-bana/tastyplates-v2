'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const AddListingPage = dynamic(
  () => import('@/components/Restaurant/Listing/AddListing'),
  { ssr: false }
);

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