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
      <Suspense fallback={<div>Loading...</div>}>
        <AddListingPage step={2} />
      </Suspense>
    </section>
  );
};

export default AddReviewPage;