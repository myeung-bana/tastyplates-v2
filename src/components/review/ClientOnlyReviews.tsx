'use client';

import dynamic from 'next/dynamic';

// Dynamically import Reviews only on client side
// The Reviews component internally handles virtualization delays
const Reviews = dynamic(() => import('./Reviews'), { 
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  )
});

export default function ClientOnlyReviews() {
  return <Reviews />;
}
