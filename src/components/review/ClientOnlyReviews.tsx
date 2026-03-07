'use client';

import dynamic from 'next/dynamic';
import ReviewCardSkeleton from '../ui/Skeleton/ReviewCardSkeleton';

// Dynamically import Reviews only on client side
const Reviews = dynamic(() => import('./Reviews'), {
  ssr: false,
  loading: () => (
    <section className="!w-full reviews !bg-white z-30 rounded-t-3xl sm:rounded-t-[40px]">
      <div className="reviews__container xl:!px-0">
        <div className="border-b border-gray-200 mb-4">
          <div className="flex justify-center py-2">
            <div className="inline-flex rounded-full bg-gray-100 p-1">
              <div className="px-4 py-2 text-sm md:text-base font-neusans font-normal rounded-full bg-white text-[#ff7c0a] shadow-sm">Trending</div>
              <div className="px-4 py-2 text-sm md:text-base font-neusans font-normal rounded-full text-gray-600">For You</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 4 }, (_, i) => (
            <ReviewCardSkeleton key={`initial-skeleton-${i}`} />
          ))}
        </div>
      </div>
    </section>
  ),
});

export default function ClientOnlyReviews() {
  return <Reviews />;
}
