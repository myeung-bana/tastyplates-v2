'use client';

import dynamic from 'next/dynamic';

// ssr:false must live in a Client Component — cannot be used directly in a Server Component page.
const UpdatePassword = dynamic(
  () => import('@/components/auth/UpdatePasswordForm'),
  {
    ssr: false,
    loading: () => (
      <div className="px-2 pt-8 sm:px-1 animate-pulse w-full max-w-[672px] mx-auto">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-4 mx-auto"></div>
        <div className="rounded-[24px] border border-[#CACACA] bg-white py-8 px-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mt-6"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded mt-8 mx-auto w-1/4"></div>
        </div>
      </div>
    ),
  }
);

export default function UpdatePasswordDynamic() {
  return <UpdatePassword />;
}
