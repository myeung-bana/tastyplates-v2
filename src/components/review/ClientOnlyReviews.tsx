'use client';

import dynamic from 'next/dynamic';

// Dynamically import Reviews only on client side
const Reviews = dynamic(() => import('./Reviews'), { ssr: false });

export default function ClientOnlyReviews() {
  return <Reviews />;
}
