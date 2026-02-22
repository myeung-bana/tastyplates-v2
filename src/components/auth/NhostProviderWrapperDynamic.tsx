'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const NhostProviderWrapper = dynamic(
  () => import('@/components/auth/NhostProviderWrapper'),
  { ssr: false }
);

interface NhostProviderWrapperDynamicProps {
  children: ReactNode;
}

/**
 * Client component that loads NhostProviderWrapper with ssr: false.
 * Required because next/dynamic with ssr: false cannot be used in Server Components (e.g. root layout).
 */
export default function NhostProviderWrapperDynamic({ children }: NhostProviderWrapperDynamicProps) {
  return <NhostProviderWrapper>{children}</NhostProviderWrapper>;
}
