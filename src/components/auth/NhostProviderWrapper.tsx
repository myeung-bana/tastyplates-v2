'use client';

import { NhostProvider } from '@nhost/nextjs';
import { nhost } from '@/lib/nhost';
import { ReactNode } from 'react';

interface NhostProviderWrapperProps {
  children: ReactNode;
}

/**
 * Client-side wrapper for Nhost Provider
 * Must be a client component to use Nhost hooks
 */
export default function NhostProviderWrapper({ children }: NhostProviderWrapperProps) {
  return (
    <NhostProvider nhost={nhost}>
      {children}
    </NhostProvider>
  );
}
